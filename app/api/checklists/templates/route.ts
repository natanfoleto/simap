import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { VehicleCategory, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.toUpperCase() as VehicleCategory | undefined;

    const where: Prisma.ChecklistTemplateWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(category ? { category } : {}),
      active: true,
    };

    const templates = await prisma.checklistTemplate.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        items: {
          where: { active: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return apiSuccess(templates);
  } catch (error) {
    console.error("GET /api/checklists/templates error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "checklists", "gerenciar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    if (!body?.name || !body?.category || !Array.isArray(body?.items) || body.items.length === 0) {
      return validationErrorResponse(null, "Nome, categoria e ao menos um item são obrigatórios.");
    }

    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.checklistTemplate.create({
        data: {
          tenantId,
          name: body.name,
          category: body.category,
          description: body.description || null,
          active: true,
        },
      });

      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        await tx.checklistTemplateItem.create({
          data: {
            tenantId,
            templateId: created.id,
            title: typeof item === "string" ? item : item.title,
            description: typeof item === "object" ? item.description || null : null,
            orderIndex: i,
            active: true,
          },
        });
      }

      return await tx.checklistTemplate.findUnique({
        where: { id: created.id },
        include: { items: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return apiSuccess(template, "Template de checklist criado com sucesso!", 201);
  } catch (error) {
    console.error("POST /api/checklists/templates error:", error);
    return internalErrorResponse();
  }
}
