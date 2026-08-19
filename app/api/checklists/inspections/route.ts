import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { inspectionExecutionSchema } from "@/lib/validations";
import { registerOdometerReadingTx } from "@/lib/domain/odometer";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { OdometerSource, Prisma, InspectionAnswerStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    let driverVehicleFilter: string[] | undefined = undefined;
    if (session.user.role === "MOTORISTA") {
      const assignments = await prisma.vehicleAssignment.findMany({
        where: { userId: session.user.id, active: true },
        select: { vehicleId: true },
      });
      driverVehicleFilter = assignments.map((a) => a.vehicleId);
      if (vehicleId && !driverVehicleFilter.includes(vehicleId)) {
        return forbiddenResponse("Acesso negado aos checklists deste veículo.");
      }
    }

    const where: Prisma.InspectionWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(driverVehicleFilter ? { vehicleId: { in: driverVehicleFilter } } : {}),
    };

    const [total, inspections] = await Promise.all([
      prisma.inspection.count({ where }),
      prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { performedAt: "desc" },
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
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          answers: {
            include: {
              templateItem: true,
            },
          },
        },
      }),
    ]);

    return apiSuccess({
      items: inspections,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/checklists/inspections error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "checklists", "executar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = inspectionExecutionSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    // 1. Escopo de motorista
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
          "Você não está vinculado a este veículo para registrar checklists."
        );
      }
    }

    // 2. Apurar severidade geral do checklist
    let hasAlert = false;
    let hasCritical = false;
    let overallStatus: InspectionAnswerStatus = "OK";

    for (const ans of data.answers) {
      if (ans.status === "CRITICO") {
        hasCritical = true;
        overallStatus = "CRITICO";
      } else if (ans.status === "ALERTA" && !hasCritical) {
        hasAlert = true;
        overallStatus = "ALERTA";
      }
    }

    // 3. Execução transacional
    const inspection = await prisma.$transaction(async (tx) => {
      // a) Atualiza hodômetro se superior ao atual
      await registerOdometerReadingTx(
        {
          tenantId,
          vehicleId: data.vehicleId,
          userId: session.user.id,
          reading: data.odometer,
          source: OdometerSource.CHECKLIST,
          notes: "Leitura capturada durante checklist operacional",
        },
        tx
      );

      // b) Salva o registro da inspeção
      const created = await tx.inspection.create({
        data: {
          tenantId,
          vehicleId: data.vehicleId,
          userId: session.user.id,
          templateId: data.templateId,
          odometer: data.odometer,
          status: overallStatus,
          hasAlert,
          hasCritical,
          notes: data.notes || null,
        },
      });

      // c) Salva as respostas dos itens
      for (const ans of data.answers) {
        await tx.inspectionAnswer.create({
          data: {
            tenantId,
            inspectionId: created.id,
            templateItemId: ans.templateItemId,
            status: ans.status,
            notes: ans.notes || null,
            photoUrl: ans.photoUrl || null,
          },
        });
      }

      // d) Registra na auditoria
      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "EXECUCAO_CHECKLIST",
          entity: "Inspection",
          entityId: created.id,
          newValues: {
            vehicleId: data.vehicleId,
            status: overallStatus,
            odometer: data.odometer,
            hasCritical,
            hasAlert,
          },
        },
        tx
      );

      return await tx.inspection.findUnique({
        where: { id: created.id },
        include: {
          answers: {
            include: { templateItem: true },
          },
          vehicle: true,
        },
      });
    });

    return apiSuccess(
      inspection,
      hasCritical
        ? "Checklist registrado com itens CRÍTICOS! Recomendada abertura de Ordem Corretiva."
        : "Checklist diário concluído com sucesso!",
      201
    );
  } catch (error: unknown) {
    console.error("POST /api/checklists/inspections error:", error);
    return internalErrorResponse((error as Error).message);
  }
}
