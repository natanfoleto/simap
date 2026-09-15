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
