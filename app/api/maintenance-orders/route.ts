import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { maintenanceOrderSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { OrderStatus, MaintenanceType, Criticality, Prisma, VehicleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId")?.trim();
    const type = searchParams.get("type")?.toUpperCase() as MaintenanceType | undefined;
    const status = searchParams.get("status")?.toUpperCase() as OrderStatus | undefined;
    const priority = searchParams.get("priority")?.toUpperCase() as Criticality | undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceOrderWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.maintenanceOrder.count({ where }),
      prisma.maintenanceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { openedAt: "desc" },
        include: {
          vehicle: {
            select: {
              id: true,
              fleetCode: true,
              plate: true,
              model: true,
              category: true,
              status: true,
            },
          },
          planItem: { select: { id: true, name: true } },
          assignedUser: { select: { id: true, name: true } },
          items: true,
        },
      }),
    ]);

    return apiSuccess({
      items: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/maintenance-orders error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "ordens", "criar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = maintenanceOrderSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Gera o número sequencial da OS no tenant
      const year = new Date().getFullYear();
      const countThisYear = await tx.maintenanceOrder.count({
        where: {
          tenantId,
          openedAt: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
          },
        },
      });
      const orderNumber = `OS-${year}-${String(countThisYear + 1).padStart(4, "0")}`;

      // 2. Calcula os custos por tipo de item
      let partsCost = 0;
      let laborCost = 0;
      let otherCost = 0;

      for (const it of data.items) {
        const lineTotal = Number(it.quantity) * Number(it.unitCost);
        if (it.itemType === "PECA") partsCost += lineTotal;
        else if (it.itemType === "SERVICO") laborCost += lineTotal;
        else otherCost += lineTotal;
      }
      const totalCost = partsCost + laborCost + otherCost;

      // 3. Cria a Ordem de Serviço
      const created = await tx.maintenanceOrder.create({
        data: {
          tenantId,
          vehicleId: data.vehicleId,
          orderNumber,
          type: data.type as MaintenanceType,
          status: OrderStatus.ABERTA,
          priority: data.priority as Criticality,
          origin: data.origin,
          planId: data.planId || null,
          planItemId: data.planItemId || null,
          inspectionId: data.inspectionId || null,
          description: data.description,
          diagnosis: data.diagnosis || null,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          odometerAtOpen: data.odometerAtOpen || null,
          partsCost,
          laborCost,
          otherCost,
          totalCost,
          providerName: data.providerName || null,
          documentReference: data.documentReference || null,
          assignedUserId: data.assignedUserId || null,
          notes: data.notes || null,
        },
      });

      // 4. Cria itens detalhados
      for (const it of data.items) {
        const itemTotal = Number(it.quantity) * Number(it.unitCost);
        await tx.maintenanceOrderItem.create({
          data: {
            tenantId,
            orderId: created.id,
            description: it.description,
            itemType: it.itemType,
            quantity: it.quantity,
            unitCost: it.unitCost,
            totalCost: itemTotal,
          },
        });
      }

      // 5. Se foi solicitado controle de indisponibilidade
      if (data.generateDowntime) {
        await tx.vehicleDowntime.create({
          data: {
            tenantId,
            vehicleId: data.vehicleId,
            orderId: created.id,
            startDate: data.downtimeStartDate ? new Date(data.downtimeStartDate) : new Date(),
            reason: `Manutenção ${data.type}: ${data.description}`,
          },
        });

        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: { status: VehicleStatus.MANUTENCAO },
        });
      }

      // 6. Auditoria
      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "CRIAR_ORDEM_SERVICO",
          entity: "MaintenanceOrder",
          entityId: created.id,
          newValues: {
            orderNumber,
            type: data.type,
            vehicleId: data.vehicleId,
            totalCost,
          },
        },
        tx
      );

      return await tx.maintenanceOrder.findUnique({
        where: { id: created.id },
        include: { items: true, vehicle: true },
      });
    });

    return apiSuccess(order, `Ordem de Serviço ${order?.orderNumber} aberta com sucesso!`, 201);
  } catch (error) {
    console.error("POST /api/maintenance-orders error:", error);
    return internalErrorResponse((error as Error).message);
  }
}
