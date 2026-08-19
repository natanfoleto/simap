import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { requireTenantAccess } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  apiFailure,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { Prisma, VehicleCategory, VehicleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get("tenantSlug") || session.user.tenantSlug || "";
    const scopeError = requireTenantAccess(session.user, tenantSlug);
    if (scopeError) return scopeError;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category") as VehicleCategory | undefined;
    const status = searchParams.get("status") as VehicleStatus | undefined;
    const active = searchParams.get("active") === "false" ? false : true;

    // Filtro de tenant obrigatório
    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Usuário sem tenant vinculado.");
    }

    const where: Prisma.VehicleWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      active,
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { plate: { contains: search.toUpperCase() } },
              { fleetCode: { contains: search.toUpperCase() } },
              { model: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
              { department: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fleetCode: "asc" }],
        include: {
          preventivePlans: {
            where: { active: true },
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  version: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return apiSuccess({
      items: vehicles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/vehicles error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "criar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return forbiddenResponse("Ação requer um tenant associado.");
    }

    const body = await req.json().catch(() => null);
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    // Verificar se já existe placa ou código da frota no tenant
    const existing = await prisma.vehicle.findFirst({
      where: {
        tenantId,
        OR: [{ plate: data.plate }, { fleetCode: data.fleetCode }],
      },
    });

    if (existing) {
      if (existing.plate === data.plate) {
        return conflictResponse(`Já existe um veículo cadastrado com a placa ${data.plate}.`);
      }
      return conflictResponse(`Já existe um veículo com o código de frota ${data.fleetCode}.`);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        tenantId,
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

    // Auditoria
    await recordAuditLog({
      tenantId,
      userId: session.user.id,
      action: "CRIAR_VEICULO",
      entity: "Vehicle",
      entityId: vehicle.id,
      newValues: vehicle,
    });

    return apiSuccess(vehicle, "Veículo cadastrado com sucesso", 201);
  } catch (error) {
    console.error("POST /api/vehicles error:", error);
    return internalErrorResponse();
  }
}
