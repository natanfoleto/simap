import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { odometerReadingSchema } from "@/lib/validations";
import { registerOdometerReadingTx } from "@/lib/domain/odometer";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { OdometerSource, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "quilometragem", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Se for motorista, filtra apenas pelos veículos vinculados a ele
    let driverVehicleFilter: string[] | undefined = undefined;
    if (session.user.role === "MOTORISTA") {
      const assignments = await prisma.vehicleAssignment.findMany({
        where: { userId: session.user.id, active: true },
        select: { vehicleId: true },
      });
      driverVehicleFilter = assignments.map((a) => a.vehicleId);
      if (vehicleId && !driverVehicleFilter.includes(vehicleId)) {
        return forbiddenResponse("Acesso negado aos registros deste veículo.");
      }
    }

    const where: Prisma.OdometerReadingWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(driverVehicleFilter ? { vehicleId: { in: driverVehicleFilter } } : {}),
    };

    const [total, readings] = await Promise.all([
      prisma.odometerReading.count({ where }),
      prisma.odometerReading.findMany({
        where,
        skip,
        take: limit,
        orderBy: { readingDate: "desc" },
        include: {
          vehicle: {
            select: {
              id: true,
              fleetCode: true,
              plate: true,
              model: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return apiSuccess({
      items: readings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/odometer-readings error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = odometerReadingSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    // 1. Validação de Escopo do Motorista
    if (session.user.role === "MOTORISTA") {
      const assignment = await prisma.vehicleAssignment.findFirst({
        where: {
          tenantId,
          vehicleId: data.vehicleId,
          userId: session.user.id,
          active: true,
        },
      });

      if (!assignment) {
        return forbiddenResponse(
          "Você não está vinculado a este veículo para registrar quilometragem."
        );
      }
    }

    // 2. Permissão de correção se for regressão
    if (data.isCorrection) {
      if (!hasPermission(session.user.role, "quilometragem", "corrigir", session.user.permissions)) {
        return forbiddenResponse("Você não possui permissão para realizar correções regressivas de hodômetro.");
      }
    } else {
      if (!hasPermission(session.user.role, "quilometragem", "registrar", session.user.permissions)) {
        return forbiddenResponse();
      }
    }

    // 3. Execução transacional
    const result = await prisma.$transaction(async (tx) => {
      return await registerOdometerReadingTx(
        {
          tenantId,
          vehicleId: data.vehicleId,
          userId: session.user.id,
          reading: data.reading,
          readingDate: data.readingDate ? new Date(data.readingDate) : new Date(),
          source: OdometerSource.MANUAL,
          isCorrection: data.isCorrection,
          correctionReason: data.correctionReason,
          notes: data.notes,
        },
        tx
      );
    });

    return apiSuccess(
      result,
      `Quilometragem (${data.reading.toLocaleString("pt-BR")} km) registrada com sucesso!`,
      201
    );
  } catch (error: unknown) {
    console.error("POST /api/odometer-readings error:", error);
    const err = error as { errorCode?: string; message?: string };
    if (err.errorCode === "ODOMETER_REGRESSION") {
      return validationErrorResponse(null, err.message);
    }
    return internalErrorResponse(err.message || "Falha ao registrar hodômetro.");
  }
}
