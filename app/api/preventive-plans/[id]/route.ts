import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { preventivePlanSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "planos", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;

    const plan = await prisma.preventivePlan.findFirst({
      where: {
        id: params.id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        items: {
          where: { active: true },
          orderBy: { orderIndex: "asc" },
        },
        assignedVehicles: {
          where: { active: true },
          include: {
            vehicle: {
              select: {
                id: true,
                fleetCode: true,
                plate: true,
                model: true,
                category: true,
                status: true,
                currentOdometer: true,
              },
            },
          },
        },
      },
    });

    if (!plan) return notFoundResponse("Plano preventivo não encontrado.");

    return apiSuccess(plan);
  } catch (error) {
    console.error("GET /api/preventive-plans/[id] error:", error);
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

    if (!hasPermission(session.user.role, "planos", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const existing = await prisma.preventivePlan.findFirst({
      where: { id: params.id, tenantId },
      include: { items: true },
    });

    if (!existing) return notFoundResponse("Plano preventivo não encontrado.");

    const body = await req.json().catch(() => null);
    const parsed = preventivePlanSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const updatedPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.preventivePlan.update({
        where: { id: params.id },
        data: {
          name: data.name,
          category: data.category,
          description: data.description || null,
          isPublished: data.isPublished,
        },
      });

      // Remove itens antigos e recria os itens atualizados
      await tx.preventivePlanItem.deleteMany({
        where: { planId: params.id },
      });

      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        await tx.preventivePlanItem.create({
          data: {
            planId: plan.id,
            tenantId,
            name: item.name,
            description: item.description || null,
            intervalKm: item.intervalKm || null,
            intervalDays: item.intervalDays || null,
            toleranceKm: item.toleranceKm || null,
            toleranceDays: item.toleranceDays || null,
            priority: item.priority,
            isMandatory: item.isMandatory,
            active: true,
            orderIndex: i,
          },
        });
      }

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "EDITAR_PLANO_PREVENTIVO",
          entity: "PreventivePlan",
          entityId: plan.id,
          oldValues: existing,
          newValues: { plan, itemsCount: data.items.length },
        },
        tx
      );

      return tx.preventivePlan.findUnique({
        where: { id: plan.id },
        include: { items: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return apiSuccess(updatedPlan, "Plano preventivo atualizado com sucesso");
  } catch (error) {
    console.error("PUT /api/preventive-plans/[id] error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "planos", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const plan = await prisma.preventivePlan.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!plan) return notFoundResponse("Plano preventivo não encontrado.");

    const updated = await prisma.preventivePlan.update({
      where: { id: params.id },
      data: { active: false },
    });

    await recordAuditLog({
      tenantId,
      userId: session.user.id,
      action: "INATIVAR_PLANO_PREVENTIVO",
      entity: "PreventivePlan",
      entityId: plan.id,
      oldValues: plan,
      newValues: updated,
    });

    return apiSuccess({ inativado: true }, "Plano inativado com sucesso");
  } catch (error) {
    console.error("DELETE /api/preventive-plans/[id] error:", error);
    return internalErrorResponse();
  }
}
