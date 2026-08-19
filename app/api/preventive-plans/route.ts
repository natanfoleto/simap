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
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { VehicleCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "planos", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as VehicleCategory | undefined;

    const plans = await prisma.preventivePlan.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        active: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        items: {
          where: { active: true },
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            assignedVehicles: { where: { active: true } },
          },
        },
      },
    });

    return apiSuccess(plans);
  } catch (error) {
    console.error("GET /api/preventive-plans error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "planos", "criar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = preventivePlanSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const createdPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.preventivePlan.create({
        data: {
          tenantId,
          name: data.name,
          category: data.category,
          description: data.description || null,
          isPublished: data.isPublished,
          version: 1,
          active: true,
        },
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
          action: "CRIAR_PLANO_PREVENTIVO",
          entity: "PreventivePlan",
          entityId: plan.id,
          newValues: { plan, itemsCount: data.items.length },
        },
        tx
      );

      return tx.preventivePlan.findUnique({
        where: { id: plan.id },
        include: { items: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return apiSuccess(createdPlan, "Plano preventivo criado com sucesso", 201);
  } catch (error) {
    console.error("POST /api/preventive-plans error:", error);
    return internalErrorResponse();
  }
}
