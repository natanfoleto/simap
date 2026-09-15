import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { kpiSnapshotCreateSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
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
  badRequestResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "financeiro", "ver", session.user.permissions)) {
      return forbiddenResponse("Acesso negado aos snapshots de indicadores.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const snapshots = await prisma.kpiSnapshot.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(year ? { referenceYear: year } : {}),
      },
      orderBy: [{ referenceYear: "desc" }, { referenceMonth: "desc" }],
    });

    return apiSuccess(snapshots);
  } catch (error) {
    console.error("GET /api/kpi-snapshots error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "financeiro", "editar", session.user.permissions)) {
      return forbiddenResponse("Apenas gestores e administradores podem congelar snapshots.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = kpiSnapshotCreateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const { referenceYear, referenceMonth, notes } = parsed.data;

    // 1. Verifica se já existe snapshot congelado para o período
    const existing = await prisma.kpiSnapshot.findUnique({
      where: {
        tenantId_referenceYear_referenceMonth: {
          tenantId,
          referenceYear,
          referenceMonth,
        },
      },
    });

    if (existing && existing.isFrozen) {
      return badRequestResponse(
        `O snapshot do mês ${String(referenceMonth).padStart(2, "0")}/${referenceYear} já está congelado e arquivado para auditoria.`
      );
    }

    // 2. Delimita o período exato do mês
    const periodStart = new Date(Date.UTC(referenceYear, referenceMonth - 1, 1, 0, 0, 0));
    // Último dia do mês: dia 0 do mês seguinte
    const periodEnd = new Date(Date.UTC(referenceYear, referenceMonth, 0, 23, 59, 59, 999));

    // 3. Coleta os dados para cálculo consolidado
    const [vehicles, orders, downtimes, odometerReadings, totalOrdersWithoutCost, vehiclesWithoutPlan] =
      await Promise.all([
        prisma.vehicle.findMany({
          where: { tenantId, active: true },
          select: { id: true, category: true },
        }),
        prisma.maintenanceOrder.findMany({
          where: {
            tenantId,
            status: { not: "CANCELADA" },
            openedAt: { gte: periodStart, lte: periodEnd },
          },
          include: {
            vehicle: { select: { category: true } },
          },
        }),
        prisma.vehicleDowntime.findMany({
          where: {
            tenantId,
            startDate: { lte: periodEnd },
            OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
          },
          select: { vehicleId: true, startDate: true, endDate: true },
        }),
        prisma.odometerReading.findMany({
          where: {
            tenantId,
            readingDate: { gte: periodStart, lte: periodEnd },
          },
          select: { vehicleId: true, reading: true },
          orderBy: { reading: "asc" },
        }),
        prisma.maintenanceOrder.count({
          where: {
            tenantId,
            status: "CONCLUIDA",
            totalCost: { equals: 0 },
            openedAt: { gte: periodStart, lte: periodEnd },
          },
        }),
        prisma.vehicle.count({
          where: {
            tenantId,
            active: true,
            preventivePlans: { none: {} },
          },
        }),
      ]);

    // 4. Agregações
    let totalCost = 0;
    let preventiveCost = 0;
    let correctiveCost = 0;
    let preventiveOrders = 0;
    let correctiveOrders = 0;
    let completedOnTimeCount = 0;

    for (const order of orders) {
      const cost = Number(order.totalCost);
      totalCost += cost;
      if (order.type === "PREVENTIVA") {
        preventiveCost += cost;
        preventiveOrders++;
        if (order.status === "CONCLUIDA") completedOnTimeCount++;
      } else if (order.type === "CORRETIVA") {
        correctiveCost += cost;
        correctiveOrders++;
      }
    }

    // Quilometragem rodada no mês
    const readingsByVehicle = new Map<string, number[]>();
    for (const r of odometerReadings) {
      const list = readingsByVehicle.get(r.vehicleId) || [];
      list.push(r.reading);
      readingsByVehicle.set(r.vehicleId, list);
    }

    let totalKmDriven: number | null = 0;
    for (const [, readings] of readingsByVehicle.entries()) {
      if (readings.length >= 2) {
        const diff = Math.max(0, Math.max(...readings) - Math.min(...readings));
        totalKmDriven += diff;
      }
    }
    if (totalKmDriven === 0 && odometerReadings.length < vehicles.length) {
      totalKmDriven = null; // Dados insuficientes
    }

    const costPerKm = calculateCostPerKm(totalCost, totalKmDriven);

    const availabilityResult = calculateFleetDowntimeAndAvailability({
      records: downtimes.map((d) => ({
        vehicleId: d.vehicleId,
        start: d.startDate,
        end: d.endDate,
      })),
      periodStart,
      periodEnd,
      totalActiveVehicles: vehicles.length,
    });

    const preventiveCompliance = calculatePreventiveCompliance(completedOnTimeCount, preventiveOrders);

    const completedOrders = orders.filter((o) => o.status === "CONCLUIDA");
    const openDowntimesWithoutEndDate = downtimes.filter((d) => d.endDate === null).length;

    const dataQuality = evaluateDataQuality({
      totalActiveVehicles: vehicles.length,
      vehiclesWithOdometerReading: readingsByVehicle.size,
      totalCompletedOrders: completedOrders.length,
      ordersWithCompleteCosts: completedOrders.length - totalOrdersWithoutCost,
      openDowntimesWithoutEndDate,
      vehiclesWithoutPreventivePlan: vehiclesWithoutPlan,
    });

    // 5. Payload de Métricas Congeladas
    const metricsData = {
      summary: {
        totalCost,
        preventiveCost,
        correctiveCost,
        totalOrders: orders.length,
        preventiveOrders,
        correctiveOrders,
        totalKmDriven,
        costPerKm,
        availabilityPercentage: availabilityResult.availabilityPercentage,
        totalDowntimeHours: availabilityResult.totalDowntimeHours,
        preventiveCompliancePercentage: preventiveCompliance,
        dataQualityScore: dataQuality.score,
      },
      frozenAt: new Date().toISOString(),
      frozenBy: session.user.email,
    };

    // 6. Gravação atômica com auditoria
    const snapshot = await prisma.$transaction(async (tx) => {
      const snap = await tx.kpiSnapshot.upsert({
        where: {
          tenantId_referenceYear_referenceMonth: {
            tenantId,
            referenceYear,
            referenceMonth,
          },
        },
        update: {
          periodStart,
          periodEnd,
          totalCost,
          preventiveCost,
          correctiveCost,
          totalOrders: orders.length,
          preventiveOrders,
          correctiveOrders,
          totalKmDriven,
          costPerKm,
          availabilityPercentage: availabilityResult.availabilityPercentage,
          totalDowntimeHours: availabilityResult.totalDowntimeHours,
          preventiveCompliancePercentage: preventiveCompliance,
          dataQualityScore: dataQuality.score,
          metricsData,
          isFrozen: true,
          createdByUserId: session.user.id,
          notes,
        },
        create: {
          tenantId,
          referenceYear,
          referenceMonth,
          periodStart,
          periodEnd,
          totalCost,
          preventiveCost,
          correctiveCost,
          totalOrders: orders.length,
          preventiveOrders,
          correctiveOrders,
          totalKmDriven,
          costPerKm,
          availabilityPercentage: availabilityResult.availabilityPercentage,
          totalDowntimeHours: availabilityResult.totalDowntimeHours,
          preventiveCompliancePercentage: preventiveCompliance,
          dataQualityScore: dataQuality.score,
          metricsData,
          isFrozen: true,
          createdByUserId: session.user.id,
          notes,
        },
      });

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "CONGELAR_SNAPSHOT_KPI_MENSAL",
          entity: "KpiSnapshot",
          entityId: snap.id,
          newValues: {
            referenceYear,
            referenceMonth,
            totalCost,
            totalOrders: orders.length,
          },
        },
        tx
      );

      return snap;
    });

    return apiSuccess(snapshot, "Snapshot mensal de indicadores congelado com sucesso");
  } catch (error) {
    console.error("POST /api/kpi-snapshots error:", error);
    return internalErrorResponse();
  }
}
