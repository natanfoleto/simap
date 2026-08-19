import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export interface TimelineEvent {
  id: string;
  type: "ODOMETER" | "CHECKLIST" | "MAINTENANCE_ORDER" | "DOWNTIME" | "AUDIT";
  title: string;
  description: string;
  date: Date | string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  metadata?: Record<string, unknown>;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!vehicle) {
      return notFoundResponse("Veículo não encontrado.");
    }

    // Busca simultânea de todos os eventos
    const [readings, inspections, orders, downtimes] = await Promise.all([
      prisma.odometerReading.findMany({
        where: { vehicleId: params.id },
        orderBy: { readingDate: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      }),
      prisma.inspection.findMany({
        where: { vehicleId: params.id },
        orderBy: { performedAt: "desc" },
        take: 50,
        include: {
          user: { select: { name: true } },
          template: { select: { name: true } },
        },
      }),
      prisma.maintenanceOrder.findMany({
        where: { vehicleId: params.id },
        orderBy: { openedAt: "desc" },
        take: 50,
        include: { assignedUser: { select: { name: true } } },
      }),
      prisma.vehicleDowntime.findMany({
        where: { vehicleId: params.id },
        orderBy: { startDate: "desc" },
        take: 50,
      }),
    ]);

    const events: TimelineEvent[] = [];

    // Mapeia leituras
    for (const r of readings) {
      events.push({
        id: `odo-${r.id}`,
        type: "ODOMETER",
        title: `Leitura de Hodômetro: ${r.reading.toLocaleString("pt-BR")} km`,
        description: r.isCorrection
          ? `Correção autorizada: ${r.correctionReason || "Sem motivo"}`
          : `Registro via ${r.source}${r.user ? ` por ${r.user.name}` : ""}`,
        date: r.readingDate,
        severity: r.isCorrection ? "WARNING" : "INFO",
        metadata: { reading: r.reading, source: r.source, isCorrection: r.isCorrection },
      });
    }

    // Mapeia inspeções
    for (const insp of inspections) {
      events.push({
        id: `insp-${insp.id}`,
        type: "CHECKLIST",
        title: `Checklist: ${insp.template?.name || "Inspeção Diária"}`,
        description: `Hodômetro: ${insp.odometer.toLocaleString("pt-BR")} km • Realizado por ${insp.user?.name}`,
        date: insp.performedAt,
        severity: insp.hasCritical ? "CRITICAL" : insp.hasAlert ? "WARNING" : "SUCCESS",
        metadata: {
          odometer: insp.odometer,
          hasCritical: insp.hasCritical,
          hasAlert: insp.hasAlert,
          inspectionId: insp.id,
        },
      });
    }

    // Mapeia ordens de serviço
    for (const ord of orders) {
      events.push({
        id: `os-${ord.id}`,
        type: "MAINTENANCE_ORDER",
        title: `Ordem de Serviço ${ord.orderNumber} (${ord.type})`,
        description: `${ord.description} • Status: ${ord.status} • Custo: R$ ${Number(ord.totalCost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        date: ord.openedAt,
        severity: ord.status === "CANCELADA" ? "INFO" : ord.type === "CORRETIVA" ? "WARNING" : "SUCCESS",
        metadata: {
          orderNumber: ord.orderNumber,
          type: ord.type,
          status: ord.status,
          totalCost: Number(ord.totalCost),
        },
      });
    }

    // Mapeia indisponibilidades
    for (const dt of downtimes) {
      events.push({
        id: `dt-${dt.id}`,
        type: "DOWNTIME",
        title: `Parada de Veículo (Indisponibilidade)`,
        description: dt.endDate
          ? `Período finalizado: ${dt.reason}`
          : `Veículo em parada desde ${new Date(dt.startDate).toLocaleDateString("pt-BR")}: ${dt.reason}`,
        date: dt.startDate,
        severity: "CRITICAL",
        metadata: { startDate: dt.startDate, endDate: dt.endDate, reason: dt.reason },
      });
    }

    // Ordenação cronológica decrescente
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return apiSuccess({
      vehicle: {
        id: vehicle.id,
        fleetCode: vehicle.fleetCode,
        plate: vehicle.plate,
        model: vehicle.model,
        category: vehicle.category,
        currentOdometer: vehicle.currentOdometer,
        status: vehicle.status,
      },
      events,
    });
  } catch (error) {
    console.error("GET /api/vehicles/[id]/timeline error:", error);
    return internalErrorResponse();
  }
}
