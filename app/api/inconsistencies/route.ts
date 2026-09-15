import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Busca em paralelo as inconsistências operacionais
    const [
      ordersWithoutCost,
      activeVehicles,
      openDowntimes,
      vehiclesWithoutPlan,
    ] = await Promise.all([
      // Ordens concluídas com custo zerado ou sem itens detalhados
      prisma.maintenanceOrder.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: "CONCLUIDA",
          OR: [
            { totalCost: { equals: 0 } },
            { items: { none: {} } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          type: true,
          totalCost: true,
          openedAt: true,
          completedAt: true,
          description: true,
          vehicle: {
            select: {
              id: true,
              fleetCode: true,
              plate: true,
              category: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
      }),

      // Veículos ativos para checagem de odômetro recente
      prisma.vehicle.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          active: true,
        },
        select: {
          id: true,
          fleetCode: true,
          plate: true,
          category: true,
          department: true,
          currentOdometer: true,
          odometerReadings: {
            orderBy: { readingDate: "desc" },
            take: 1,
            select: {
              reading: true,
              readingDate: true,
            },
          },
        },
        orderBy: { fleetCode: "asc" },
      }),

      // Registros de indisponibilidade em aberto (sem data de término)
      prisma.vehicleDowntime.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          endDate: null,
        },
        select: {
          id: true,
          startDate: true,
          reason: true,
          notes: true,
          vehicle: {
            select: {
              id: true,
              fleetCode: true,
              plate: true,
              category: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
      }),

      // Veículos ativos sem plano preventivo associado
      prisma.vehicle.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
          active: true,
          preventivePlans: { none: {} },
        },
        select: {
          id: true,
          fleetCode: true,
          plate: true,
          category: true,
          department: true,
        },
        orderBy: { fleetCode: "asc" },
      }),
    ]);

    // Filtra veículos sem leitura nos últimos 30 dias
    const vehiclesWithoutRecentReading = activeVehicles
      .filter((v) => {
        if (v.odometerReadings.length === 0) return true;
        const lastDate = v.odometerReadings[0].readingDate;
        return lastDate < thirtyDaysAgo;
      })
      .map((v) => ({
        id: v.id,
        fleetCode: v.fleetCode,
        plate: v.plate,
        category: v.category,
        department: v.department || "Não informado",
        lastReading: v.odometerReadings[0]?.reading ?? v.currentOdometer,
        lastReadingDate: v.odometerReadings[0]?.readingDate ?? null,
      }));

    const totalIssues =
      ordersWithoutCost.length +
      vehiclesWithoutRecentReading.length +
      openDowntimes.length +
      vehiclesWithoutPlan.length;

    return apiSuccess({
      counts: {
        total: totalIssues,
        ordersWithoutCost: ordersWithoutCost.length,
        vehiclesWithoutRecentReading: vehiclesWithoutRecentReading.length,
        openDowntimes: openDowntimes.length,
        vehiclesWithoutPlan: vehiclesWithoutPlan.length,
      },
      details: {
        ordersWithoutCost,
        vehiclesWithoutRecentReading,
        openDowntimes,
        vehiclesWithoutPlan,
      },
    });
  } catch (error) {
    console.error("GET /api/inconsistencies error:", error);
    return internalErrorResponse();
  }
}
