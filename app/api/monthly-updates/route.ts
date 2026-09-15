import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { monthlyProjectUpdateSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");

    if (yearParam && monthParam) {
      const update = await prisma.monthlyProjectUpdate.findUnique({
        where: {
          tenantId_referenceYear_referenceMonth: {
            tenantId: tenantId!,
            referenceYear: parseInt(yearParam, 10),
            referenceMonth: parseInt(monthParam, 10),
          },
        },
      });
      return apiSuccess(update);
    }

    const updates = await prisma.monthlyProjectUpdate.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(yearParam ? { referenceYear: parseInt(yearParam, 10) } : {}),
      },
      orderBy: [{ referenceYear: "desc" }, { referenceMonth: "desc" }],
    });

    return apiSuccess(updates);
  } catch (error) {
    console.error("GET /api/monthly-updates error:", error);
    return internalErrorResponse();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "projeto", "editar", session.user.permissions)) {
      return forbiddenResponse("Acesso negado para registrar atualização de projeto.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = monthlyProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const update = await prisma.$transaction(async (tx) => {
      const record = await tx.monthlyProjectUpdate.upsert({
        where: {
          tenantId_referenceYear_referenceMonth: {
            tenantId,
            referenceYear: data.referenceYear,
            referenceMonth: data.referenceMonth,
          },
        },
        update: {
          advancesSummary: data.advancesSummary,
          nextSteps: data.nextSteps,
          observations: data.observations,
          createdByUserId: session.user.id,
        },
        create: {
          tenantId,
          referenceYear: data.referenceYear,
          referenceMonth: data.referenceMonth,
          advancesSummary: data.advancesSummary,
          nextSteps: data.nextSteps,
          observations: data.observations,
          createdByUserId: session.user.id,
        },
      });

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "ATUALIZAR_AVANCO_MENSAL_PROJETO",
          entity: "MonthlyProjectUpdate",
          entityId: record.id,
          newValues: {
            year: data.referenceYear,
            month: data.referenceMonth,
          },
        },
        tx
      );

      return record;
    });

    return apiSuccess(update, "Atualização do mês registrada com sucesso");
  } catch (error) {
    console.error("PUT /api/monthly-updates error:", error);
    return internalErrorResponse();
  }
}
