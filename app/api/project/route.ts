import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { projectSettingsSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const [settings, vehiclesCount, activeVehiclesCount] = await Promise.all([
      prisma.tenantSetting.findMany({
        where: { ...(tenantId ? { tenantId } : {}) },
      }),
      prisma.vehicle.count({
        where: { ...(tenantId ? { tenantId } : {}) },
      }),
      prisma.vehicle.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          active: true,
        },
      }),
    ]);

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const baselineYear = parseInt(settingsMap["BASELINE_YEAR"] || "2025", 10);
    const baselineAmount = parseFloat(settingsMap["BASELINE_AMOUNT"] || "285000.00");
    const targetReductionPercentage = parseFloat(settingsMap["TARGET_REDUCTION_PERCENTAGE"] || "20.00");
    const calculatedTargetSavings = (baselineAmount * targetReductionPercentage) / 100;

    return apiSuccess({
      settings: {
        baselineYear,
        baselineAmount,
        targetReductionPercentage,
        calculatedTargetSavings,
      },
      stats: {
        totalVehicles: vehiclesCount,
        activeVehicles: activeVehiclesCount,
        inactiveVehicles: vehiclesCount - activeVehiclesCount,
        expectedFleetTotal: 97, // Frota informada de Jaborandi/SP
        registrationCoveragePercentage: Math.min(100, (vehiclesCount / 97) * 100),
      },
    });
  } catch (error) {
    console.error("GET /api/project error:", error);
    return internalErrorResponse();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "projeto", "editar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = projectSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.tenantSetting.upsert({
        where: { tenantId_key: { tenantId, key: "BASELINE_YEAR" } },
        update: { value: String(data.baselineYear) },
        create: { tenantId, key: "BASELINE_YEAR", value: String(data.baselineYear) },
      });

      await tx.tenantSetting.upsert({
        where: { tenantId_key: { tenantId, key: "BASELINE_AMOUNT" } },
        update: { value: data.baselineAmount.toFixed(2) },
        create: { tenantId, key: "BASELINE_AMOUNT", value: data.baselineAmount.toFixed(2) },
      });

      await tx.tenantSetting.upsert({
        where: { tenantId_key: { tenantId, key: "TARGET_REDUCTION_PERCENTAGE" } },
        update: { value: data.targetReductionPercentage.toFixed(2) },
        create: { tenantId, key: "TARGET_REDUCTION_PERCENTAGE", value: data.targetReductionPercentage.toFixed(2) },
      });

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "ATUALIZAR_PARAMETROS_FROTA",
          entity: "TenantSetting",
          entityId: tenantId,
          newValues: data,
        },
        tx
      );
    });

    return apiSuccess(data, "Parâmetros da frota atualizados com sucesso");
  } catch (error) {
    console.error("PUT /api/project error:", error);
    return internalErrorResponse();
  }
}
