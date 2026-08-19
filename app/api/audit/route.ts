import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "auditoria", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const action = searchParams.get("action")?.trim();
    const entity = searchParams.get("entity")?.trim();
    const search = searchParams.get("search")?.trim();

    const where: Prisma.AuditLogWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(action ? { action: { equals: action } } : {}),
      ...(entity ? { entity: { equals: entity } } : {}),
      ...(search
        ? {
            OR: [
              { action: { contains: search, mode: "insensitive" } },
              { entity: { contains: search, mode: "insensitive" } },
              { entityId: { contains: search } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return apiSuccess({
      items: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return internalErrorResponse();
  }
}
