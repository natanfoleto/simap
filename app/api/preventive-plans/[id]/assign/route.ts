import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export async function POST(
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

    const plan = await prisma.preventivePlan.findFirst({
      where: { id: params.id, tenantId, active: true },
    });

    if (!plan) return notFoundResponse("Plano preventivo não encontrado ou inativo.");

    const body = await req.json().catch(() => null);
    const { vehicleIds } = body || {};

    if (!Array.isArray(vehicleIds)) {
      return validationErrorResponse("A lista de IDs de veículos é obrigatória.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Desativa vínculos anteriores de veículos que não estão na nova lista
      await tx.vehiclePreventivePlan.updateMany({
        where: {
          planId: params.id,
          tenantId,
          vehicleId: { notIn: vehicleIds },
        },
        data: { active: false },
      });

      // 2. Cria ou ativa os vínculos para os veículos selecionados
      const assignments = [];
      for (const vehicleId of vehicleIds) {
        const assignment = await tx.vehiclePreventivePlan.upsert({
          where: {
            vehicleId_planId: {
              vehicleId,
              planId: params.id,
            },
          },
          update: { active: true },
          create: {
            tenantId,
            vehicleId,
            planId: params.id,
            active: true,
          },
        });
        assignments.push(assignment);
      }

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "VINCULAR_PLANO_VEICULOS",
          entity: "PreventivePlan",
          entityId: plan.id,
          newValues: { planId: plan.id, assignedCount: vehicleIds.length, vehicleIds },
        },
        tx
      );

      return assignments;
    });

    return apiSuccess(
      { count: result.length },
      `Plano vinculado a ${result.length} veículo(s) com sucesso`
    );
  } catch (error) {
    console.error("POST /api/preventive-plans/[id]/assign error:", error);
    return internalErrorResponse();
  }
}
