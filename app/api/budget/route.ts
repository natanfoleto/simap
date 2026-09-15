import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { annualBudgetSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "financeiro", "ver", session.user.permissions)) {
      return forbiddenResponse("Acesso negado aos dados de orçamento.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // 1. Busca configurações gerais de baseline caso não haja registro específico
    const settings = await prisma.tenantSetting.findMany({
      where: { ...(tenantId ? { tenantId } : {}) },
    });
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    const defaultBaselineAmount = parseFloat(settingsMap["BASELINE_AMOUNT"] || "285000.00");
    const defaultReductionPercentage = parseFloat(settingsMap["TARGET_REDUCTION_PERCENTAGE"] || "20.00");

    // 2. Busca ou inicializa o orçamento para o ano
    let budget = await prisma.annualMaintenanceBudget.findFirst({
      where: {
        ...(tenantId ? { tenantId } : {}),
        year,
      },
    });

    if (!budget && tenantId) {
      // Cria orçamento padrão baseado na meta do município
      const calculatedTargetBudget = defaultBaselineAmount * (1 - defaultReductionPercentage / 100);
      budget = await prisma.annualMaintenanceBudget.create({
        data: {
          tenantId,
          year,
          baselineAmount: defaultBaselineAmount,
          targetReductionPercentage: defaultReductionPercentage,
          plannedPreventive: Number((calculatedTargetBudget * 0.65).toFixed(2)), // 65% preventiva
          plannedCorrective: Number((calculatedTargetBudget * 0.25).toFixed(2)), // 25% corretiva
          plannedContingency: Number((calculatedTargetBudget * 0.10).toFixed(2)), // 10% contingência
          notes: `Orçamento de referência para o exercício de ${year} com meta de redução de ${defaultReductionPercentage}%.`,
        },
      });
    }

    // 3. Calcula os gastos realizados no ano especificado
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    const orders = await prisma.maintenanceOrder.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        status: { not: "CANCELADA" },
        openedAt: { gte: startOfYear, lte: endOfYear },
      },
      select: {
        totalCost: true,
        type: true,
        status: true,
      },
    });

    let realizedTotal = 0;
    let realizedPreventive = 0;
    let realizedCorrective = 0;

    for (const order of orders) {
      const cost = Number(order.totalCost);
      realizedTotal += cost;
      if (order.type === "PREVENTIVA") realizedPreventive += cost;
      else if (order.type === "CORRETIVA") realizedCorrective += cost;
    }

    const baselineAmount = budget ? Number(budget.baselineAmount) : defaultBaselineAmount;
    const targetReductionPercentage = budget ? Number(budget.targetReductionPercentage) : defaultReductionPercentage;
    const plannedPreventive = budget ? Number(budget.plannedPreventive) : 0;
    const plannedCorrective = budget ? Number(budget.plannedCorrective) : 0;
    const plannedContingency = budget ? Number(budget.plannedContingency) : 0;
    const totalPlanned = plannedPreventive + plannedCorrective + plannedContingency;

    const targetSavings = (baselineAmount * targetReductionPercentage) / 100;
    const targetSpendingCap = baselineAmount - targetSavings;
    const remainingBalance = totalPlanned - realizedTotal;
    const actualSavingsVsBaseline = baselineAmount - realizedTotal;

    return apiSuccess({
      budget: {
        id: budget?.id,
        year,
        baselineAmount,
        targetReductionPercentage,
        targetSavings,
        targetSpendingCap,
        plannedPreventive,
        plannedCorrective,
        plannedContingency,
        totalPlanned,
        notes: budget?.notes,
        createdAt: budget?.createdAt,
        updatedAt: budget?.updatedAt,
      },
      execution: {
        realizedTotal: Number(realizedTotal.toFixed(2)),
        realizedPreventive: Number(realizedPreventive.toFixed(2)),
        realizedCorrective: Number(realizedCorrective.toFixed(2)),
        preventiveSharePercentage:
          realizedTotal > 0 ? Number(((realizedPreventive / realizedTotal) * 100).toFixed(1)) : 0,
        correctiveSharePercentage:
          realizedTotal > 0 ? Number(((realizedCorrective / realizedTotal) * 100).toFixed(1)) : 0,
        remainingBalance: Number(remainingBalance.toFixed(2)),
        executionPercentage:
          totalPlanned > 0 ? Number(((realizedTotal / totalPlanned) * 100).toFixed(1)) : 0,
        actualSavingsVsBaseline: Number(actualSavingsVsBaseline.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("GET /api/budget error:", error);
    return internalErrorResponse();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "financeiro", "editar", session.user.permissions)) {
      return forbiddenResponse("Acesso negado para alteração de orçamento.");
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = annualBudgetSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    const updatedBudget = await prisma.$transaction(async (tx) => {
      const budget = await tx.annualMaintenanceBudget.upsert({
        where: {
          tenantId_year: {
            tenantId,
            year: data.year,
          },
        },
        update: {
          baselineAmount: data.baselineAmount,
          targetReductionPercentage: data.targetReductionPercentage,
          plannedPreventive: data.plannedPreventive,
          plannedCorrective: data.plannedCorrective,
          plannedContingency: data.plannedContingency,
          notes: data.notes,
        },
        create: {
          tenantId,
          year: data.year,
          baselineAmount: data.baselineAmount,
          targetReductionPercentage: data.targetReductionPercentage,
          plannedPreventive: data.plannedPreventive,
          plannedCorrective: data.plannedCorrective,
          plannedContingency: data.plannedContingency,
          notes: data.notes,
        },
      });

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "ATUALIZAR_ORCAMENTO_ANUAL",
          entity: "AnnualMaintenanceBudget",
          entityId: budget.id,
          newValues: data,
        },
        tx
      );

      return budget;
    });

    return apiSuccess(updatedBudget, "Orçamento anual atualizado com sucesso");
  } catch (error) {
    console.error("PUT /api/budget error:", error);
    return internalErrorResponse();
  }
}
