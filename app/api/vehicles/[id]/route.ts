import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        preventivePlans: {
          where: { active: true },
          include: {
            plan: {
              include: {
                items: {
                  where: { active: true },
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!vehicle) return notFoundResponse("Veículo não encontrado.");

    return apiSuccess(vehicle);
  } catch (error) {
    console.error("GET /api/vehicles/[id] error:", error);
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

    if (!hasPermission(session.user.role, "veiculos", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const existing = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    });

    if (!existing) return notFoundResponse("Veículo não encontrado.");

    const body = await req.json().catch(() => null);
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    // Verificar duplicidade de placa ou código em outro veículo
    const duplicate = await prisma.vehicle.findFirst({
      where: {
        tenantId,
        id: { not: params.id },
        OR: [{ plate: data.plate }, { fleetCode: data.fleetCode }],
      },
    });

    if (duplicate) {
      if (duplicate.plate === data.plate) {
        return conflictResponse(`A placa ${data.plate} já está cadastrada em outro veículo.`);
      }
      return conflictResponse(`O código de frota ${data.fleetCode} já pertence a outro veículo.`);
    }

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        fleetCode: data.fleetCode,
        plate: data.plate,
        category: data.category,
        brand: data.brand,
        model: data.model,
        year: data.year,
        fuelType: data.fuelType,
        purpose: data.purpose,
        department: data.department || null,
        criticality: data.criticality,
        status: data.status,
        currentOdometer: data.currentOdometer,
        isPilot: data.isPilot,
        active: data.active,
        notes: data.notes || null,
      },
    });

    await recordAuditLog({
      tenantId,
      userId: session.user.id,
      action: "EDITAR_VEICULO",
      entity: "Vehicle",
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return apiSuccess(updated, "Veículo atualizado com sucesso");
  } catch (error) {
    console.error("PUT /api/vehicles/[id] error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "inativar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId },
      include: {
        preventivePlans: { where: { active: true } },
      },
    });

    if (!vehicle) return notFoundResponse("Veículo não encontrado.");

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Inativação segura
    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: { active: false, status: "INATIVO" },
    });

    await recordAuditLog({
      tenantId,
      userId: session.user.id,
      action: "INATIVAR_VEICULO",
      entity: "Vehicle",
      entityId: vehicle.id,
      oldValues: vehicle,
      newValues: updated,
    });

    return apiSuccess({ inativado: true }, "Veículo inativado com sucesso");
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] error:", error);
    return internalErrorResponse();
  }
}
