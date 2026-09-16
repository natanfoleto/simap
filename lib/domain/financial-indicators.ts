/**
 * Módulo de Regras de Domínio e Indicadores Financeiros — SIMAP (Roadmap R2)
 *
 * Contém algoritmos auditáveis e testados para:
 * 1. Custo por km sem denominador inválido;
 * 2. Disponibilidade da frota e horas de parada sem contagem duplicada de sobreposições;
 * 3. Taxa de cumprimento de manutenções preventivas;
 * 4. Avaliação e pontuação de integridade dos dados operacionais.
 */

export interface TimeInterval {
  start: Date;
  end: Date;
}

export interface VehicleDowntimeRecord {
  vehicleId: string;
  start: Date;
  end: Date | null;
}

/**
 * Calcula o custo médio por quilômetro rodado (R$/km).
 *
 * Regra de Domínio:
 * - Se o km rodado no período for menor ou igual a zero, ou nulo/indefinido,
 *   retorna `null` para que a interface exiba explicitamente "Sem dados suficientes",
 *   evitando mascarar a ausência de leituras como zero artificial.
 */
export function calculateCostPerKm(
  totalCost: number,
  kmDriven: number | null | undefined
): number | null {
  if (kmDriven === null || kmDriven === undefined || kmDriven <= 0) {
    return null;
  }
  if (totalCost < 0) {
    return null;
  }

  const result = totalCost / kmDriven;
  return Number(result.toFixed(4));
}

/**
 * Mescla intervalos temporais sobrepostos ou contíguos de um mesmo veículo.
 * Garante que períodos de parada com registro simultâneo não sejam somados duplamente.
 */
export function mergeOverlappingIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length <= 1) {
    return [...intervals];
  }

  // Ordena pelo horário de início
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];

    if (current.start.getTime() <= previous.end.getTime()) {
      // Sobreposição ou continuidade: estende o fim se o atual terminar depois
      if (current.end.getTime() > previous.end.getTime()) {
        previous.end = new Date(current.end.getTime());
      }
    } else {
      // Intervalo disjunto: adiciona à lista
      merged.push({
        start: new Date(current.start.getTime()),
        end: new Date(current.end.getTime()),
      });
    }
  }

  return merged;
}

/**
 * Calcula o total de horas de parada (downtime) e a taxa de disponibilidade percentual da frota.
 *
 * Algoritmo:
 * 1. Agrupa os intervalos por `vehicleId`;
 * 2. Faz o recorte (*clipping*) de cada intervalo aos limites do período avaliado;
 * 3. Para cada veículo, aplica fusão de intervalos sobrepostos (`mergeOverlappingIntervals`);
 * 4. Soma as horas líquidas de parada de todos os veículos;
 * 5. Compara contra o total de horas operacionais possíveis da frota ativa.
 */
export function calculateFleetDowntimeAndAvailability(params: {
  records: VehicleDowntimeRecord[];
  periodStart: Date;
  periodEnd: Date;
  totalActiveVehicles: number;
}): {
  totalDowntimeHours: number;
  totalFleetHours: number;
  availabilityPercentage: number;
} {
  const { records, periodStart, periodEnd, totalActiveVehicles } = params;

  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();

  if (endMs <= startMs || totalActiveVehicles <= 0) {
    return {
      totalDowntimeHours: 0,
      totalFleetHours: 0,
      availabilityPercentage: 100,
    };
  }

  const periodDurationHours = (endMs - startMs) / (1000 * 60 * 60);
  const totalFleetHours = Number((totalActiveVehicles * periodDurationHours).toFixed(2));

  // Agrupa os registros por veículo
  const recordsByVehicle = new Map<string, TimeInterval[]>();

  const referenceNowMs = Math.min(Date.now(), endMs);

  for (const rec of records) {
    const recStartMs = rec.start.getTime();
    // Se a parada ainda não foi encerrada, utiliza o menor entre a data atual e o fim do período
    const recEndMs = rec.end ? rec.end.getTime() : referenceNowMs;

    // Recorte do intervalo ao período em análise
    const clippedStart = Math.max(recStartMs, startMs);
    const clippedEnd = Math.min(recEndMs, endMs);

    if (clippedEnd > clippedStart) {
      const list = recordsByVehicle.get(rec.vehicleId) || [];
      list.push({
        start: new Date(clippedStart),
        end: new Date(clippedEnd),
      });
      recordsByVehicle.set(rec.vehicleId, list);
    }
  }

  // Mescla os intervalos de cada veículo e acumula as horas de parada
  let totalDowntimeHoursAccumulator = 0;

  for (const [, intervals] of recordsByVehicle.entries()) {
    const merged = mergeOverlappingIntervals(intervals);
    for (const interval of merged) {
      const hours = (interval.end.getTime() - interval.start.getTime()) / (1000 * 60 * 60);
      totalDowntimeHoursAccumulator += hours;
    }
  }

  const totalDowntimeHours = Number(totalDowntimeHoursAccumulator.toFixed(2));

  // A disponibilidade não pode exceder 100% nem ser inferior a 0%
  const effectiveAvailableHours = Math.max(0, totalFleetHours - totalDowntimeHours);
  const rawAvailability = (effectiveAvailableHours / totalFleetHours) * 100;
  const availabilityPercentage = Number(Math.max(0, Math.min(100, rawAvailability)).toFixed(2));

  return {
    totalDowntimeHours,
    totalFleetHours,
    availabilityPercentage,
  };
}

/**
 * Calcula a taxa de cumprimento (aderência) de manutenções preventivas.
 */
export function calculatePreventiveCompliance(
  completedOnTime: number,
  totalDue: number
): number {
  if (totalDue <= 0) {
    return 100;
  }
  if (completedOnTime <= 0) {
    return 0;
  }

  const percentage = (completedOnTime / totalDue) * 100;
  return Number(Math.max(0, Math.min(100, percentage)).toFixed(1));
}

/**
 * Avalia a cobertura e a qualidade dos dados operacionais da frota.
 */
export function evaluateDataQuality(params: {
  totalActiveVehicles: number;
  vehiclesWithOdometerReading: number;
  totalCompletedOrders: number;
  ordersWithCompleteCosts: number;
  openDowntimesWithoutEndDate: number;
  vehiclesWithoutPreventivePlan: number;
}): {
  score: number;
  odometerCoveragePercentage: number;
  costCompletenessPercentage: number;
  pendingInconsistenciesCount: number;
} {
  const {
    totalActiveVehicles,
    vehiclesWithOdometerReading,
    totalCompletedOrders,
    ordersWithCompleteCosts,
    openDowntimesWithoutEndDate,
    vehiclesWithoutPreventivePlan,
  } = params;

  const odoCoverage =
    totalActiveVehicles > 0
      ? (vehiclesWithOdometerReading / totalActiveVehicles) * 100
      : 100;

  const costCompleteness =
    totalCompletedOrders > 0
      ? (ordersWithCompleteCosts / totalCompletedOrders) * 100
      : 100;

  const pendingInconsistenciesCount =
    openDowntimesWithoutEndDate +
    vehiclesWithoutPreventivePlan +
    Math.max(0, totalActiveVehicles - vehiclesWithOdometerReading) +
    Math.max(0, totalCompletedOrders - ordersWithCompleteCosts);

  // Score ponderado: 50% cobertura de km + 50% discriminação de custos, com penalidade para inconsistências
  const baseScore = odoCoverage * 0.5 + costCompleteness * 0.5;
  const penalty = Math.min(30, pendingInconsistenciesCount * 2);
  const finalScore = Number(Math.max(0, Math.min(100, baseScore - penalty)).toFixed(1));

  return {
    score: finalScore,
    odometerCoveragePercentage: Number(odoCoverage.toFixed(1)),
    costCompletenessPercentage: Number(costCompleteness.toFixed(1)),
    pendingInconsistenciesCount,
  };
}

export type InsightSeverity = "POSITIVE" | "WARNING" | "INFO" | "CRITICAL";

export interface FleetInsight {
  id: string;
  category: "TRANSITION" | "EFFICIENCY" | "AVAILABILITY" | "DATA_QUALITY" | "BUDGET";
  severity: InsightSeverity;
  title: string;
  description: string;
  metric: string;
  recommendation?: string;
}

export interface FleetInsightsInput {
  totalCost: number;
  preventiveCost: number;
  correctiveCost: number;
  preventiveOrdersCount: number;
  correctiveOrdersCount: number;
  totalOrdersCount: number;
  costPerKm: number | null;
  totalKmDriven: number;
  availabilityPercentage: number;
  totalDowntimeHours: number;
  dataQualityScore: number;
  costCompletenessPercentage: number;
  odometerCoveragePercentage: number;
  pendingInconsistenciesCount: number;
  topCategoryByCost?: { category: string; cost: number; percentage: number };
}

/**
 * Gera os Primeiros Insights Analíticos da frota baseados em regras transparentes e auditáveis.
 * Em conformidade com os critérios do Mês 4 / Roadmap R2.
 */
export function generateFleetFinancialInsights(input: FleetInsightsInput): FleetInsight[] {
  const insights: FleetInsight[] = [];
  const {
    totalCost,
    preventiveCost,
    correctiveCost,
    preventiveOrdersCount,
    correctiveOrdersCount,
    totalOrdersCount,
    costPerKm,
    totalKmDriven,
    availabilityPercentage,
    totalDowntimeHours,
    costCompletenessPercentage,
    pendingInconsistenciesCount,
    topCategoryByCost,
  } = input;

  const prevCostPct = totalCost > 0 ? (preventiveCost / totalCost) * 100 : 0;
  const prevOrdersPct = totalOrdersCount > 0 ? (preventiveOrdersCount / totalOrdersCount) * 100 : 0;

  // 1. Regra de Transição: Proporção e Volume Preventivo vs Corretivo
  if (totalOrdersCount > 0) {
    if (prevCostPct >= 55 && prevOrdersPct >= 50) {
      insights.push({
        id: "transition-proactive",
        category: "TRANSITION",
        severity: "POSITIVE",
        title: "Inversão da Curva: Transição Proativa Consolidada",
        metric: `${prevOrdersPct.toFixed(0)}% das OS / ${prevCostPct.toFixed(0)}% dos Gastos em Preventivas`,
        description: `${preventiveOrdersCount} de ${totalOrdersCount} intervenções e ${prevCostPct.toFixed(1)}% dos recursos foram aplicados em manutenções preventivas, reduzindo a incidência de falhas graves e preservando a vida útil dos veículos.`,
        recommendation: "Manter a aderência às revisões programadas e monitorar itens com maior desgaste nos veículos pesados.",
      });
    } else if (prevCostPct >= 40) {
      insights.push({
        id: "transition-in-progress",
        category: "TRANSITION",
        severity: "INFO",
        title: "Transição Preventiva em Andamento",
        metric: `${prevOrdersPct.toFixed(0)}% das OS Preventivas`,
        description: `O modelo preventivo representa ${prevOrdersPct.toFixed(1)}% do volume e ${prevCostPct.toFixed(1)}% dos custos. Ainda há espaço para antecipar manutenções antes da ocorrência de corretivas.`,
        recommendation: "Reforçar as vistorias preventivas via checklist digital na abertura de turno.",
      });
    } else {
      insights.push({
        id: "transition-corrective-dominant",
        category: "TRANSITION",
        severity: "WARNING",
        title: "Predomínio de Manutenções Corretivas Emergenciais",
        metric: `${(100 - prevCostPct).toFixed(0)}% dos Gastos em Corretivas`,
        description: `A manutenção corretiva consumiu a maioria dos recursos financeiros (R$ ${correctiveCost.toFixed(2)}). Corretivas não programadas geram custos até 3x superiores e maior tempo de parada.`,
        recommendation: "Priorizar o plano preventivo para os veículos do grupo piloto e frotas de emergência/escolar.",
      });
    }
  }

  // 2. Regra de Custo por Quilômetro Rodado
  if (costPerKm !== null) {
    if (costPerKm <= 0.85) {
      insights.push({
        id: "cost-per-km-efficient",
        category: "EFFICIENCY",
        severity: "POSITIVE",
        title: "Custo por Quilômetro em Patamar Eficiente",
        metric: `R$ ${costPerKm.toFixed(2)} / km rodado`,
        description: `O custo médio da frota apurado em R$ ${costPerKm.toFixed(2)}/km sobre ${totalKmDriven.toLocaleString("pt-BR")} km rodados atesta controle eficiente de insumos e mão de obra no período.`,
        recommendation: "Acompanhar variações mensais por categoria para identificar precocemente aumentos de consumo.",
      });
    } else {
      insights.push({
        id: "cost-per-km-high",
        category: "EFFICIENCY",
        severity: "WARNING",
        title: "Custo por Quilômetro Acima da Média de Referência",
        metric: `R$ ${costPerKm.toFixed(2)} / km rodado`,
        description: `Custo médio apurado de R$ ${costPerKm.toFixed(2)}/km indica maior concentração de reparos complexos em relação à quilometragem percorrida no período.`,
        recommendation: "Verificar veículos específicos com custo por km desproporcional na tabela analítica.",
      });
    }
  } else {
    insights.push({
      id: "cost-per-km-insufficient",
      category: "EFFICIENCY",
      severity: "INFO",
      title: "Apuração de Custo por Quilômetro em Coleta",
      metric: "Sem dados suficientes",
      description: "São necessárias pelo menos duas leituras consecutivas de odômetro por veículo para apurar o km percorrido e o custo unitário por km.",
      recommendation: "Incentivar motoristas e operadores a registrar o odômetro nas vistorias e checklists.",
    });
  }

  // 3. Regra de Disponibilidade Operacional & Downtime
  if (availabilityPercentage >= 90) {
    insights.push({
      id: "availability-sla-met",
      category: "AVAILABILITY",
      severity: "POSITIVE",
      title: "Disponibilidade da Frota Acima da Meta Municipal",
      metric: `${availabilityPercentage.toFixed(1)}% Operacional`,
      description: `A frota atingiu ${availabilityPercentage.toFixed(1)}% de disponibilidade líquida, cumprindo o SLA municipal mínimo de 90%. Total de ${totalDowntimeHours} horas de parada calculadas sem dupla contagem.`,
      recommendation: "Garantir estoque de peças críticas (filtros, pastilhas) para agilizar o tempo de liberação da oficina.",
    });
  } else {
    insights.push({
      id: "availability-sla-breached",
      category: "AVAILABILITY",
      severity: "WARNING",
      title: "Disponibilidade Abaixo do SLA Municipal de 90%",
      metric: `${availabilityPercentage.toFixed(1)}% Operacional (${totalDowntimeHours}h paradas)`,
      description: `O tempo de indisponibilidade superou o limite recomendado, impactando a prontidão operacional de setores chave.`,
      recommendation: "Priorizar o encerramento de ordens de serviço em andamento e agilizar compras de peças.",
    });
  }

  // 4. Regra de Cobertura e 100% dos Gastos Registrados
  if (costCompletenessPercentage === 100 && pendingInconsistenciesCount === 0) {
    insights.push({
      id: "quality-100-costs-recorded",
      category: "DATA_QUALITY",
      severity: "POSITIVE",
      title: "100% dos Gastos Registrados com Conformidade Integral",
      metric: "100% dos Custos Discriminados (0 Pendências)",
      description: "Todas as Ordens de Serviço concluídas possuem detalhamento completo de peças, serviços e fornecedores. Nenhuma inconsistência cadastral ou contábil pendente.",
      recommendation: "Base de dados 100% auditável e pronta para auditorias do Tribunal de Contas.",
    });
  } else if (costCompletenessPercentage >= 80) {
    insights.push({
      id: "quality-high-completeness",
      category: "DATA_QUALITY",
      severity: "INFO",
      title: "Alta Integridade dos Registros Operacionais",
      metric: `${costCompletenessPercentage.toFixed(1)}% de Completude de Gastos`,
      description: `${costCompletenessPercentage.toFixed(1)}% dos gastos estão discriminados com precisão. Há ${pendingInconsistenciesCount} inconsistência(s) secundária(s) em monitoramento.`,
      recommendation: "Acessar o Painel de Inconsistências para sanar pendências e manter a conformidade plena.",
    });
  } else {
    insights.push({
      id: "quality-needs-attention",
      category: "DATA_QUALITY",
      severity: "WARNING",
      title: "Atenção: Ordens de Serviço sem Discriminação Completa",
      metric: `${costCompletenessPercentage.toFixed(1)}% de Completude`,
      description: `Parte das ordens de serviço finalizadas não discriminou separadamente os valores de peças e mão de obra, reduzindo a precisão analítica.`,
      recommendation: "Exigir o preenchimento obrigatório dos itens de OS antes do fechamento operacional.",
    });
  }

  // 5. Concentração por Categoria
  if (topCategoryByCost && topCategoryByCost.cost > 0 && topCategoryByCost.percentage >= 30) {
    insights.push({
      id: "budget-top-category",
      category: "BUDGET",
      severity: "INFO",
      title: `Concentração Orçamentária na Categoria: ${topCategoryByCost.category}`,
      metric: `${topCategoryByCost.percentage.toFixed(1)}% dos Gastos Totais`,
      description: `A categoria ${topCategoryByCost.category} representou R$ ${topCategoryByCost.cost.toFixed(2)} do total investido em manutenção no período selecionado.`,
      recommendation: `Manter atenção redobrada no plano preventivo de ${topCategoryByCost.category} para conter desvios orçamentários.`,
    });
  }

  return insights;
}

