import { addDays, differenceInCalendarDays } from "date-fns";

export type MaintenanceDueStatus = "EM_DIA" | "PROXIMA" | "VENCIDA" | "SEM_DADOS";

export interface PlanItemRules {
  name: string;
  intervalKm?: number | null;
  intervalDays?: number | null;
  toleranceKm?: number | null;
  toleranceDays?: number | null;
}

export interface MaintenanceDueCalculation {
  status: MaintenanceDueStatus;
  nextDueKm: number | null;
  remainingKm: number | null;
  nextDueDate: Date | null;
  remainingDays: number | null;
  dueReason: "KM" | "TEMPO" | "AMBOS" | "NENHUM";
}

/**
 * Calcula o vencimento e status de um item preventivo aplicando a regra do primeiro critério atingido
 */
export function calculateMaintenanceDueStatus(
  item: PlanItemRules,
  lastMaintenanceKm: number | null,
  lastMaintenanceDate: Date | string | null,
  currentOdometer: number,
  currentDate = new Date()
): MaintenanceDueCalculation {
  const hasKmRule = typeof item.intervalKm === "number" && item.intervalKm > 0;
  const hasTimeRule = typeof item.intervalDays === "number" && item.intervalDays > 0;

  if (!hasKmRule && !hasTimeRule) {
    return {
      status: "SEM_DADOS",
      nextDueKm: null,
      remainingKm: null,
      nextDueDate: null,
      remainingDays: null,
      dueReason: "NENHUM",
    };
  }

  const baseKm = lastMaintenanceKm ?? 0;
  const baseDate = lastMaintenanceDate
    ? typeof lastMaintenanceDate === "string"
      ? new Date(lastMaintenanceDate)
      : lastMaintenanceDate
    : null;

  // 1. Cálculo de Quilometragem
  let nextDueKm: number | null = null;
  let remainingKm: number | null = null;
  let isKmOverdue = false;
  let isKmNear = false;

  if (hasKmRule && item.intervalKm) {
    nextDueKm = baseKm + item.intervalKm;
    remainingKm = nextDueKm - currentOdometer;
    const tolKm = item.toleranceKm ?? 500;

    if (remainingKm <= 0) {
      isKmOverdue = true;
    } else if (remainingKm <= tolKm) {
      isKmNear = true;
    }
  }

  // 2. Cálculo de Tempo
  let nextDueDate: Date | null = null;
  let remainingDays: number | null = null;
  let isTimeOverdue = false;
  let isTimeNear = false;

  if (hasTimeRule && item.intervalDays) {
    if (baseDate && !isNaN(baseDate.getTime())) {
      nextDueDate = addDays(baseDate, item.intervalDays);
      remainingDays = differenceInCalendarDays(nextDueDate, currentDate);
      const tolDays = item.toleranceDays ?? 7;

      if (remainingDays <= 0) {
        isTimeOverdue = true;
      } else if (remainingDays <= tolDays) {
        isTimeNear = true;
      }
    }
  }

  // 3. Vencimento pelo PRIMEIRO CRITÉRIO ATINGIDO
  if (isKmOverdue && isTimeOverdue) {
    return {
      status: "VENCIDA",
      nextDueKm,
      remainingKm,
      nextDueDate,
      remainingDays,
      dueReason: "AMBOS",
    };
  }

  if (isKmOverdue) {
    return {
      status: "VENCIDA",
      nextDueKm,
      remainingKm,
      nextDueDate,
      remainingDays,
      dueReason: "KM",
    };
  }

  if (isTimeOverdue) {
    return {
      status: "VENCIDA",
      nextDueKm,
      remainingKm,
      nextDueDate,
      remainingDays,
      dueReason: "TEMPO",
    };
  }

  if (isKmNear || isTimeNear) {
    return {
      status: "PROXIMA",
      nextDueKm,
      remainingKm,
      nextDueDate,
      remainingDays,
      dueReason: isKmNear && isTimeNear ? "AMBOS" : isKmNear ? "KM" : "TEMPO",
    };
  }

  return {
    status: "EM_DIA",
    nextDueKm,
    remainingKm,
    nextDueDate,
    remainingDays,
    dueReason: "NENHUM",
  };
}
