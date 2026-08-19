import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;

    const inspection = await prisma.inspection.findFirst({
      where: {
        id: params.id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        vehicle: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        template: true,
        answers: {
          include: { templateItem: true },
          orderBy: { templateItem: { orderIndex: "asc" } },
        },
      },
    });

    if (!inspection) {
      return notFoundResponse("Inspeção não encontrada.");
    }

    return apiSuccess(inspection);
  } catch (error) {
    console.error("GET /api/checklists/inspections/[id] error:", error);
    return internalErrorResponse();
  }
}
