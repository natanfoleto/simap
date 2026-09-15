import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { financialFilterSchema } from "@/lib/validations";
import {
  calculateCostPerKm,
  calculateFleetDowntimeAndAvailability,
  calculatePreventiveCompliance,
  evaluateDataQuality,
} from "@/lib/domain/financial-indicators";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api-helpers";
import { Prisma, VehicleCategory, MaintenanceType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    // Verificação rigorosa de autorização para dados financeiros
    if (!hasPermission(session.user.role, "financeiro", "ver", session.user.permissions)) {
      return forbiddenResponse("Acesso negado aos indicadores e custos financeiros.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const url = new URL(req.url);
    const queryObj = {
      period: url.searchParams.get("period") || "year",
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      category: url.searchParams.get("category") || undefined,
      vehicleId: url.searchParams.get("vehicleId") || undefined,
      maintenanceType: url.searchParams.get("maintenanceType") || undefined,
      status: url.searchParams.get("status") || undefined,
      pilotOnly: url.searchParams.get("pilotOnly") ? url.searchParams.get("pilotOnly") === "true" : undefined,
      department: url.searchParams.get("department") || undefined,
    };

    const parsed = financialFilterSchema.safeParse(queryObj);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const filters = parsed.data;
    const now = new Date();

    // 1. Determina as datas de início e fim do período
    let periodStart: Date;
    let periodEnd: Date = now;

    if (filters.period === "30d") {
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filters.period === "90d") {
      periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (filters.period === "custom" && filters.startDate) {
      periodStart = new Date(filters.startDate);
      if (filters.endDate) {
        periodEnd = new Date(filters.endDate);
      }
    } else {
      // Padrão: Ano atual (1º de janeiro até hoje/fim do ano)
      const currentYear = now.getFullYear();
      periodStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
      periodEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));
    }

    // Período anterior equivalente para comparação percentual
    const periodDurationMs = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodStart = new Date(periodStart.getTime() - periodDurationMs);
    const prevPeriodEnd = new Date(periodStart.getTime());

    // 2. Filtros de Veículo
    const vehicleWhere: Prisma.VehicleWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      active: true,
      ...(filters.category ? { category: filters.category as VehicleCategory } : {}),
      ...(filters.vehicleId ? { id: filters.vehicleId } : {}),
      ...(filters.pilotOnly ? { isPilot: true } : {}),
      ...(filters.department ? { department: filters.department } : {}),
    };

    // 3. Busca paralela das entidades de análise
    const [
      vehicles,
      orders,
      prevOrders,
      downtimes,
      odometerReadings,
      totalOrdersWithoutCost,
      vehiclesWithoutPlan,
    ] = await Promise.all([
      prisma.vehicle.findMany({
        where: vehicleWhere,
        select: {
          id: true,
          fleetCode: true,
          plate: true,
          category: true,
          brand: true,
          model: true,
          department: true,
          currentOdometer: true,
          isPilot: true,
          preventivePlans: {
            where: { active: true },
            select: { id: true },
          },
        },
      }),

      prisma.maintenanceOrder.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: { not: "CANCELADA" },
          openedAt: { gte: periodStart, lte: periodEnd },
          vehicle: vehicleWhere,
          ...(filters.maintenanceType ? { type: filters.maintenanceType as MaintenanceType } : {}),
        },
        include: {
          items: true,
          vehicle: {
            select: {
              id: true,
              fleetCode: true,
              plate: true,
              category: true,
            },
          },
        },
        orderBy: { openedAt: "asc" },
      }),

      prisma.maintenanceOrder.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: { not: "CANCELADA" },
          openedAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
          vehicle: vehicleWhere,
          ...(filters.maintenanceType ? { type: filters.maintenanceType as MaintenanceType } : {}),
        },
        select: {
          totalCost: true,
          type: true,
          status: true,
        },
      }),

      prisma.vehicleDowntime.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          vehicle: vehicleWhere,
          startDate: { lte: periodEnd },
          OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
        },
        select: {
          vehicleId: true,
          startDate: true,
          endDate: true,
        },
      }),

      prisma.odometerReading.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          vehicle: vehicleWhere,
          readingDate: { gte: periodStart, lte: periodEnd },
        },
        select: {
          vehicleId: true,
          reading: true,
          readingDate: true,
        },
        orderBy: { reading: "asc" },
      }),

      prisma.maintenanceOrder.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: "CONCLUIDA",
          totalCost: { equals: 0 },
        },
      }),

      prisma.vehicle.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          active: true,
          preventivePlans: { none: {} },
        },
      }),
    ]);

    // 4. Cálculos Financeiros e Operacionais do Período Atual
    let totalCost = 0;
    let partsCost = 0;
    let laborCost = 0;
    let otherCost = 0;
    let preventiveCost = 0;
    let correctiveCost = 0;
    let totalOrdersCount = orders.length;
    let preventiveOrdersCount = 0;
    let correctiveOrdersCount = 0;
    let inspectionOrdersCount = 0;
    let completedOnTimeCount = 0;

    const costByVehicle = new Map<
      string,
      { totalCost: number; preventiveCost: number; correctiveCost: number; ordersCount: number }
    >();

    const costByCategory = new Map<
      string,
      { totalCost: number; preventiveCost: number; correctiveCost: number; ordersCount: number }
    >();

    for (const order of orders) {
      const orderCost = Number(order.totalCost);
      const orderParts = Number(order.partsCost);
      const orderLabor = Number(order.laborCost);
      const orderOther = Number(order.otherCost);

      totalCost += orderCost;
      partsCost += orderParts;
      laborCost += orderLabor;
      otherCost += orderOther;

      if (order.type === "PREVENTIVA") {
        preventiveCost += orderCost;
        preventiveOrdersCount++;
        if (order.status === "CONCLUIDA") completedOnTimeCount++;
      } else if (order.type === "CORRETIVA") {
        correctiveCost += orderCost;
        correctiveOrdersCount++;
      } else {
        inspectionOrdersCount++;
      }

      // Agregação por Veículo
      const vCost = costByVehicle.get(order.vehicleId) || {
        totalCost: 0,
        preventiveCost: 0,
        correctiveCost: 0,
        ordersCount: 0,
      };
      vCost.totalCost += orderCost;
      vCost.ordersCount++;
      if (order.type === "PREVENTIVA") vCost.preventiveCost += orderCost;
      else if (order.type === "CORRETIVA") vCost.correctiveCost += orderCost;
      costByVehicle.set(order.vehicleId, vCost);

      // Agregação por Categoria
      const catKey = order.vehicle.category;
      const catCost = costByCategory.get(catKey) || {
        totalCost: 0,
        preventiveCost: 0,
        correctiveCost: 0,
        ordersCount: 0,
      };
      catCost.totalCost += orderCost;
      catCost.ordersCount++;
      if (order.type === "PREVENTIVA") catCost.preventiveCost += orderCost;
      else if (order.type === "CORRETIVA") catCost.correctiveCost += orderCost;
      costByCategory.set(catKey, catCost);
    }

    // 5. Cálculo do Delta de Quilometragem por Veículo no Período
    const readingsByVehicle = new Map<string, number[]>();
    for (const r of odometerReadings) {
      const list = readingsByVehicle.get(r.vehicleId) || [];
      list.push(r.reading);
      readingsByVehicle.set(r.vehicleId, list);
    }

    let totalKmDriven = 0;
    const kmDrivenByVehicle = new Map<string, number>();

    for (const [vehicleId, readings] of readingsByVehicle.entries()) {
      if (readings.length >= 2) {
        const minOdo = Math.min(...readings);
        const maxOdo = Math.max(...readings);
        const diff = Math.max(0, maxOdo - minOdo);
        kmDrivenByVehicle.set(vehicleId, diff);
        totalKmDriven += diff;
      } else {
        kmDrivenByVehicle.set(vehicleId, 0);
      }
    }

    // 6. Custo por Km (Regra de Domínio: null se km rodado for <= 0)
    const costPerKm = calculateCostPerKm(totalCost, totalKmDriven);

    // 7. Disponibilidade da Frota com Algoritmo de Fusão de Intervalos
    const downtimeRecords = downtimes.map((d) => ({
      vehicleId: d.vehicleId,
      start: d.startDate,
      end: d.endDate,
    }));

    const availabilityResult = calculateFleetDowntimeAndAvailability({
      records: downtimeRecords,
      periodStart,
      periodEnd,
      totalActiveVehicles: vehicles.length,
    });

    // 8. Taxa de Cumprimento Preventivo
    const preventiveCompliancePercentage = calculatePreventiveCompliance(
      completedOnTimeCount,
      preventiveOrdersCount
    );

    // 9. Qualidade e Cobertura de Dados
    const vehiclesWithReadingsCount = readingsByVehicle.size;
    const openDowntimesWithoutEndDate = downtimes.filter((d) => d.endDate === null).length;
    const completedOrdersCount = orders.filter((o) => o.status === "CONCLUIDA").length;
    const completedOrdersWithCompleteCost = orders.filter(
      (o) => o.status === "CONCLUIDA" && Number(o.totalCost) > 0
    ).length;

    const dataQuality = evaluateDataQuality({
      totalActiveVehicles: vehicles.length,
      vehiclesWithOdometerReading: vehiclesWithReadingsCount,
      totalCompletedOrders: completedOrdersCount,
      ordersWithCompleteCosts: completedOrdersWithCompleteCost,
      openDowntimesWithoutEndDate,
      vehiclesWithoutPreventivePlan: vehiclesWithoutPlan,
    });

    // 10. Comparativo com o Período Anterior
    let prevTotalCost = 0;
    let prevPreventiveCost = 0;
    let prevCorrectiveCost = 0;
    const prevOrdersCount = prevOrders.length;

    for (const o of prevOrders) {
      const c = Number(o.totalCost);
      prevTotalCost += c;
      if (o.type === "PREVENTIVA") prevPreventiveCost += c;
      else if (o.type === "CORRETIVA") prevCorrectiveCost += c;
    }

    const calculateDelta = (current: number, previous: number): number | null => {
      if (previous === 0) return null;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const deltas = {
      totalCost: calculateDelta(totalCost, prevTotalCost),
      preventiveCost: calculateDelta(preventiveCost, prevPreventiveCost),
      correctiveCost: calculateDelta(correctiveCost, prevCorrectiveCost),
      ordersCount: calculateDelta(totalOrdersCount, prevOrdersCount),
    };

    // 11. Séries Temporais para Gráficos Recharts (Agrupado por mês)
    const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
    const timelineMap = new Map<
      string,
      { label: string; dateKey: string; preventiveCost: number; correctiveCost: number; totalCost: number; preventiveCount: number; correctiveCount: number }
    >();

    for (const order of orders) {
      const dateKey = order.openedAt.toISOString().slice(0, 7); // YYYY-MM
      const label = monthFormatter.format(order.openedAt);
      const entry = timelineMap.get(dateKey) || {
        label,
        dateKey,
        preventiveCost: 0,
        correctiveCost: 0,
        totalCost: 0,
        preventiveCount: 0,
        correctiveCount: 0,
      };

      const cost = Number(order.totalCost);
      entry.totalCost += cost;
      if (order.type === "PREVENTIVA") {
        entry.preventiveCost += cost;
        entry.preventiveCount++;
      } else if (order.type === "CORRETIVA") {
        entry.correctiveCost += cost;
        entry.correctiveCount++;
      }
      timelineMap.set(dateKey, entry);
    }

    const timeSeries = Array.from(timelineMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => ({
        ...val,
        preventiveCost: Number(val.preventiveCost.toFixed(2)),
        correctiveCost: Number(val.correctiveCost.toFixed(2)),
        totalCost: Number(val.totalCost.toFixed(2)),
      }));

    // 12. Distribuição por Categoria
    const categoriesDistribution = Array.from(costByCategory.entries()).map(([category, stats]) => ({
      category,
      totalCost: Number(stats.totalCost.toFixed(2)),
      preventiveCost: Number(stats.preventiveCost.toFixed(2)),
      correctiveCost: Number(stats.correctiveCost.toFixed(2)),
      ordersCount: stats.ordersCount,
    }));

    // 13. Tabela Detalhada por Veículo
    const vehiclesSummary = vehicles.map((v) => {
      const vCost = costByVehicle.get(v.id) || {
        totalCost: 0,
        preventiveCost: 0,
        correctiveCost: 0,
        ordersCount: 0,
      };
      const km = kmDrivenByVehicle.get(v.id) || 0;
      const vCostPerKm = calculateCostPerKm(vCost.totalCost, km);

      return {
        id: v.id,
        fleetCode: v.fleetCode,
        plate: v.plate,
        category: v.category,
        model: `${v.brand} ${v.model}`,
        department: v.department || "Não informado",
        currentOdometer: v.currentOdometer,
        kmDriven: km,
        totalCost: Number(vCost.totalCost.toFixed(2)),
        preventiveCost: Number(vCost.preventiveCost.toFixed(2)),
        correctiveCost: Number(vCost.correctiveCost.toFixed(2)),
        ordersCount: vCost.ordersCount,
        costPerKm: vCostPerKm,
        isPilot: v.isPilot,
        hasPlan: v.preventivePlans.length > 0,
      };
    });

    return apiSuccess({
      period: {
        type: filters.period,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      summary: {
        totalCost: Number(totalCost.toFixed(2)),
        partsCost: Number(partsCost.toFixed(2)),
        laborCost: Number(laborCost.toFixed(2)),
        otherCost: Number(otherCost.toFixed(2)),
        preventiveCost: Number(preventiveCost.toFixed(2)),
        correctiveCost: Number(correctiveCost.toFixed(2)),
        preventiveCostPercentage:
          totalCost > 0 ? Number(((preventiveCost / totalCost) * 100).toFixed(1)) : 0,
        correctiveCostPercentage:
          totalCost > 0 ? Number(((correctiveCost / totalCost) * 100).toFixed(1)) : 0,
        totalOrdersCount,
        preventiveOrdersCount,
        correctiveOrdersCount,
        inspectionOrdersCount,
        totalKmDriven,
        costPerKm,
        availabilityPercentage: availabilityResult.availabilityPercentage,
        totalDowntimeHours: availabilityResult.totalDowntimeHours,
        totalFleetHours: availabilityResult.totalFleetHours,
        preventiveCompliancePercentage,
        dataQualityScore: dataQuality.score,
        odometerCoveragePercentage: dataQuality.odometerCoveragePercentage,
        costCompletenessPercentage: dataQuality.costCompletenessPercentage,
        pendingInconsistenciesCount: dataQuality.pendingInconsistenciesCount,
      },
      deltas,
      timeSeries,
      categoriesDistribution,
      vehiclesSummary,
      activeVehiclesCount: vehicles.length,
    });
  } catch (error) {
    console.error("GET /api/financial error:", error);
    return internalErrorResponse();
  }
}
