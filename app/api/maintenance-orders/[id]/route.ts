import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { registerOdometerReadingTx } from "@/lib/domain/odometer";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { OrderStatus, VehicleStatus, OdometerSource, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;

    const order = await prisma.maintenanceOrder.findFirst({
      where: {
        id: params.id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        vehicle: true,
        plan: true,
        planItem: true,
        inspection: {
          include: {
            answers: { include: { templateItem: true } },
          },
        },
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        items: true,
        downtimes: { orderBy: { startDate: "desc" } },
      },
    });

    if (!order) {
      return notFoundResponse("Ordem de serviço não encontrada.");
    }

    return apiSuccess(order);
  } catch (error) {
    console.error("GET /api/maintenance-orders/[id] error:", error);
    return internalErrorResponse();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "ordens", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    const body = await req.json().catch(() => null);

    const existingOrder = await prisma.maintenanceOrder.findFirst({
      where: { id: params.id, ...(tenantId ? { tenantId } : {}) },
      include: { items: true },
    });

    if (!existingOrder) {
      return notFoundResponse("Ordem de serviço não encontrada.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      let partsCost = Number(existingOrder.partsCost);
      let laborCost = Number(existingOrder.laborCost);
      let otherCost = Number(existingOrder.otherCost);

      // Se novos itens foram enviados para substituição/adição
      if (Array.isArray(body?.items)) {
        await tx.maintenanceOrderItem.deleteMany({ where: { orderId: params.id } });
        partsCost = 0;
        laborCost = 0;
        otherCost = 0;

        for (const it of body.items) {
          const lineTotal = Number(it.quantity) * Number(it.unitCost);
          if (it.itemType === "PECA") partsCost += lineTotal;
          else if (it.itemType === "SERVICO") laborCost += lineTotal;
          else otherCost += lineTotal;

          await tx.maintenanceOrderItem.create({
            data: {
              tenantId: existingOrder.tenantId,
              orderId: params.id,
              description: it.description,
              itemType: it.itemType || "PECA",
              quantity: it.quantity || 1,
              unitCost: it.unitCost || 0,
              totalCost: lineTotal,
            },
          });
        }
      }

      const totalCost = partsCost + laborCost + otherCost;
      const newStatus = (body?.status as OrderStatus) || existingOrder.status;

      let startedAt = existingOrder.startedAt;
      let completedAt = existingOrder.completedAt;

      if (newStatus === OrderStatus.EM_EXECUCAO && !startedAt) {
        startedAt = new Date();
      }

      if (newStatus === OrderStatus.CONCLUIDA) {
        completedAt = new Date();

        // Encerra qualquer indisponibilidade aberta vinculada a esta OS
        await tx.vehicleDowntime.updateMany({
          where: { orderId: params.id, endDate: null },
          data: { endDate: new Date() },
        });

        // Restaura status do veículo para ATIVO se não houver outras ordens em aberto
        const otherOpenOrders = await tx.maintenanceOrder.count({
          where: {
            vehicleId: existingOrder.vehicleId,
            id: { not: params.id },
            status: { in: [OrderStatus.ABERTA, OrderStatus.EM_EXECUCAO] },
          },
        });

        if (otherOpenOrders === 0) {
          await tx.vehicle.update({
            where: { id: existingOrder.vehicleId },
            data: { status: VehicleStatus.ATIVO },
          });
        }

        // Se informou hodômetro de encerramento, registra leitura
        if (body?.odometerAtClose && body.odometerAtClose > 0) {
          await registerOdometerReadingTx(
            {
              tenantId: existingOrder.tenantId,
              vehicleId: existingOrder.vehicleId,
              userId: session.user.id,
              reading: body.odometerAtClose,
              source: OdometerSource.ORDEM_SERVICO,
              notes: `Encerramento da OS ${existingOrder.orderNumber}`,
            },
            tx
          );
        }
      }

      const res = await tx.maintenanceOrder.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          priority: body?.priority || existingOrder.priority,
          description: body?.description || existingOrder.description,
          diagnosis: body?.diagnosis !== undefined ? body.diagnosis : existingOrder.diagnosis,
          providerName: body?.providerName !== undefined ? body.providerName : existingOrder.providerName,
          documentReference: body?.documentReference !== undefined ? body.documentReference : existingOrder.documentReference,
          assignedUserId: body?.assignedUserId !== undefined ? body.assignedUserId : existingOrder.assignedUserId,
          odometerAtClose: body?.odometerAtClose !== undefined ? body.odometerAtClose : existingOrder.odometerAtClose,
          notes: body?.notes !== undefined ? body.notes : existingOrder.notes,
          partsCost,
          laborCost,
          otherCost,
          totalCost,
          startedAt,
          completedAt,
        },
        include: { items: true, vehicle: true },
      });

      await recordAuditLog(
        {
          tenantId: existingOrder.tenantId,
          userId: session.user.id,
          action: "ATUALIZAR_ORDEM_SERVICO",
          entity: "MaintenanceOrder",
          entityId: params.id,
          oldValues: { status: existingOrder.status, totalCost: Number(existingOrder.totalCost) },
          newValues: { status: newStatus, totalCost },
        },
        tx
      );

      return res;
    });

    return apiSuccess(updated, "Ordem de serviço atualizada com sucesso!");
  } catch (error) {
    console.error("PUT /api/maintenance-orders/[id] error:", error);
    return internalErrorResponse((error as Error).message);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "ordens", "cancelar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    const body = await req.json().catch(() => null);
    const cancelReason = body?.reason || "Cancelamento operacional";

    const existingOrder = await prisma.maintenanceOrder.findFirst({
      where: { id: params.id, ...(tenantId ? { tenantId } : {}) },
    });

    if (!existingOrder) {
      return notFoundResponse("Ordem de serviço não encontrada.");
    }

    const canceled = await prisma.$transaction(async (tx) => {
      // 1. Marca como cancelada
      const updated = await tx.maintenanceOrder.update({
        where: { id: params.id },
        data: {
          status: OrderStatus.CANCELADA,
          canceledAt: new Date(),
          cancelReason,
        },
      });

      // 2. Encerra downtime
      await tx.vehicleDowntime.updateMany({
        where: { orderId: params.id, endDate: null },
        data: { endDate: new Date(), notes: `Cancelada: ${cancelReason}` },
      });

      // 3. Restaura veículo
      const otherOpenOrders = await tx.maintenanceOrder.count({
        where: {
          vehicleId: existingOrder.vehicleId,
          id: { not: params.id },
          status: { in: [OrderStatus.ABERTA, OrderStatus.EM_EXECUCAO] },
        },
      });

      if (otherOpenOrders === 0) {
        await tx.vehicle.update({
          where: { id: existingOrder.vehicleId },
          data: { status: VehicleStatus.ATIVO },
        });
      }

      // 4. Auditoria
      await recordAuditLog(
        {
          tenantId: existingOrder.tenantId,
          userId: session.user.id,
          action: "CANCELAR_ORDEM_SERVICO",
          entity: "MaintenanceOrder",
          entityId: params.id,
          oldValues: { status: existingOrder.status },
          newValues: { status: OrderStatus.CANCELADA, cancelReason },
        },
        tx
      );

      return updated;
    });

    return apiSuccess(canceled, "Ordem de serviço cancelada com sucesso.");
  } catch (error) {
    console.error("DELETE /api/maintenance-orders/[id] error:", error);
    return internalErrorResponse((error as Error).message);
  }
}
