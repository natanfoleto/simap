import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { vehicleAssignmentSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();
    const vehicleId = searchParams.get("vehicleId")?.trim();

    const assignments = await prisma.vehicleAssignment.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(userId ? { userId } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        active: true,
      },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return apiSuccess(assignments);
  } catch (error) {
    console.error("GET /api/vehicle-assignments error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = vehicleAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const assignment = await prisma.$transaction(async (tx) => {
      const upserted = await tx.vehicleAssignment.upsert({
        where: {
          vehicleId_userId: {
            vehicleId: data.vehicleId,
            userId: data.userId,
          },
        },
        update: {
          active: true,
          notes: data.notes || null,
        },
        create: {
          tenantId,
          vehicleId: data.vehicleId,
          userId: data.userId,
          active: true,
          notes: data.notes || null,
        },
        include: { vehicle: true, user: true },
      });

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "VINCULAR_MOTORISTA",
          entity: "VehicleAssignment",
          entityId: upserted.id,
          newValues: {
            vehicleId: data.vehicleId,
            userId: data.userId,
          },
        },
        tx
      );

      return upserted;
    });

    return apiSuccess(assignment, "Vínculo de motorista realizado com sucesso!", 201);
  } catch (error) {
    console.error("POST /api/vehicle-assignments error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return validationErrorResponse(null, "ID do vínculo obrigatório.");
    }

    await prisma.vehicleAssignment.updateMany({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      data: { active: false },
    });

    return apiSuccess(null, "Vínculo desativado com sucesso.");
  } catch (error) {
    console.error("DELETE /api/vehicle-assignments error:", error);
    return internalErrorResponse();
  }
}
