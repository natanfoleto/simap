import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { pilotGroupSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { PilotStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;

    const groups = await prisma.pilotGroup.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        vehicles: {
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

    return apiSuccess(groups);
  } catch (error) {
    console.error("GET /api/pilot-groups error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "projeto", "gerenciar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = pilotGroupSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.pilotGroup.create({
        data: {
          tenantId,
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          notes: data.notes || null,
          status: PilotStatus.ATIVO,
        },
      });

      for (const vId of data.vehicleIds) {
        await tx.pilotGroupVehicle.create({
          data: {
            tenantId,
            groupId: created.id,
            vehicleId: vId,
            active: true,
          },
        });

        await tx.vehicle.update({
          where: { id: vId },
          data: { isPilot: true },
        });
      }

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "CRIAR_GRUPO_PILOTO",
          entity: "PilotGroup",
          entityId: created.id,
          newValues: { name: data.name, vehiclesCount: data.vehicleIds.length },
        },
        tx
      );

      return await tx.pilotGroup.findUnique({
        where: { id: created.id },
        include: {
          vehicles: {
            include: { vehicle: true },
          },
        },
      });
    });

    return apiSuccess(group, "Grupo piloto criado com sucesso!", 201);
  } catch (error) {
    console.error("POST /api/pilot-groups error:", error);
    return internalErrorResponse();
  }
}
