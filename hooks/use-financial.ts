import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { AnnualBudgetInput, KpiSnapshotCreateInput, MonthlyProjectUpdateInput } from "@/lib/validations";

export interface FinancialSummaryData {
  period: {
    type: string;
    start: string;
    end: string;
  };
  summary: {
    totalCost: number;
    partsCost: number;
    laborCost: number;
    otherCost: number;
    preventiveCost: number;
    correctiveCost: number;
    preventiveCostPercentage: number;
    correctiveCostPercentage: number;
    totalOrdersCount: number;
    preventiveOrdersCount: number;
    correctiveOrdersCount: number;
    inspectionOrdersCount: number;
    totalKmDriven: number;
    costPerKm: number | null;
    availabilityPercentage: number;
    totalDowntimeHours: number;
    totalFleetHours: number;
    preventiveCompliancePercentage: number;
    dataQualityScore: number;
    odometerCoveragePercentage: number;
    costCompletenessPercentage: number;
    pendingInconsistenciesCount: number;
  };
  deltas: {
    totalCost: number | null;
    preventiveCost: number | null;
    correctiveCost: number | null;
    ordersCount: number | null;
  };
  timeSeries: Array<{
    label: string;
    dateKey: string;
    preventiveCost: number;
    correctiveCost: number;
    totalCost: number;
    preventiveCount: number;
    correctiveCount: number;
  }>;
  categoriesDistribution: Array<{
    category: string;
    totalCost: number;
    preventiveCost: number;
    correctiveCost: number;
    ordersCount: number;
  }>;
  vehiclesSummary: Array<{
    id: string;
    fleetCode: string;
    plate: string;
    category: string;
    model: string;
    department: string;
    currentOdometer: number;
    kmDriven: number;
    totalCost: number;
    preventiveCost: number;
    correctiveCost: number;
    ordersCount: number;
    costPerKm: number | null;
    isPilot: boolean;
    hasPlan: boolean;
  }>;
  activeVehiclesCount: number;
}

export interface BudgetData {
  budget: {
    id?: string;
    year: number;
    baselineAmount: number;
    targetReductionPercentage: number;
    targetSavings: number;
    targetSpendingCap: number;
    plannedPreventive: number;
    plannedCorrective: number;
    plannedContingency: number;
    totalPlanned: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  execution: {
    realizedTotal: number;
    realizedPreventive: number;
    realizedCorrective: number;
    preventiveSharePercentage: number;
    correctiveSharePercentage: number;
    remainingBalance: number;
    executionPercentage: number;
    actualSavingsVsBaseline: number;
  };
}

export interface KpiSnapshotItem {
  id: string;
  tenantId: string;
  referenceYear: number;
  referenceMonth: number;
  periodStart: string;
  periodEnd: string;
  totalCost: number;
  preventiveCost: number;
  correctiveCost: number;
  totalOrders: number;
  preventiveOrders: number;
  correctiveOrders: number;
  totalKmDriven: number | null;
  costPerKm: number | null;
  availabilityPercentage: number;
  totalDowntimeHours: number;
  preventiveCompliancePercentage: number;
  dataQualityScore: number;
  metricsData: {
    summary: Record<string, unknown>;
    frozenAt: string;
    frozenBy?: string;
  };
  isFrozen: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface InconsistenciesData {
  counts: {
    total: number;
    ordersWithoutCost: number;
    vehiclesWithoutRecentReading: number;
    openDowntimes: number;
    vehiclesWithoutPlan: number;
  };
  details: {
    ordersWithoutCost: Array<{
      id: string;
      orderNumber: string;
      type: string;
      totalCost: number;
      openedAt: string;
      completedAt: string | null;
      description: string;
      vehicle: {
        id: string;
        fleetCode: string;
        plate: string;
        category: string;
      };
    }>;
    vehiclesWithoutRecentReading: Array<{
      id: string;
      fleetCode: string;
      plate: string;
      category: string;
      department: string;
      lastReading: number;
      lastReadingDate: string | null;
    }>;
    openDowntimes: Array<{
      id: string;
      startDate: string;
      reason: string;
      notes: string | null;
      vehicle: {
        id: string;
        fleetCode: string;
        plate: string;
        category: string;
      };
      order: {
        id: string;
        orderNumber: string;
        status: string;
      } | null;
    }>;
    vehiclesWithoutPlan: Array<{
      id: string;
      fleetCode: string;
      plate: string;
      category: string;
      department: string | null;
    }>;
  };
}

export interface MonthlyProjectUpdateItem {
  id: string;
  referenceYear: number;
  referenceMonth: number;
  advancesSummary: string;
  nextSteps: string;
  observations?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useFinancial(filters: Record<string, unknown> = {}) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      queryParams.set(k, String(v));
    }
  });

  return useQuery<FinancialSummaryData>({
    queryKey: queryKeys.financial.summary(filters),
    queryFn: async () => {
      const res = await fetch(`/api/financial?${queryParams.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao carregar indicadores financeiros.");
      }
      return json.data;
    },
  });
}

export function useBudget(year?: number) {
  const currentYear = year || new Date().getFullYear();
  return useQuery<BudgetData>({
    queryKey: queryKeys.budget.byYear(currentYear),
    queryFn: async () => {
      const res = await fetch(`/api/budget?year=${currentYear}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao carregar orçamento.");
      }
      return json.data;
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnnualBudgetInput) => {
      const res = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao atualizar orçamento.");
      }
      return json.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.budget.byYear(vars.year) });
      qc.invalidateQueries({ queryKey: ["financial"] });
    },
  });
}

export function useKpiSnapshots(year?: number) {
  return useQuery<KpiSnapshotItem[]>({
    queryKey: queryKeys.kpiSnapshots.list(year),
    queryFn: async () => {
      const url = year ? `/api/kpi-snapshots?year=${year}` : "/api/kpi-snapshots";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao carregar snapshots.");
      }
      return json.data;
    },
  });
}

export function useCreateKpiSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: KpiSnapshotCreateInput) => {
      const res = await fetch("/api/kpi-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao congelar snapshot mensal.");
      }
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kpiSnapshots.all });
    },
  });
}

export function useInconsistencies() {
  return useQuery<InconsistenciesData>({
    queryKey: queryKeys.inconsistencies.all,
    queryFn: async () => {
      const res = await fetch("/api/inconsistencies");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao carregar inconsistências.");
      }
      return json.data;
    },
  });
}

export function useMonthlyUpdates(year?: number, month?: number) {
  return useQuery<MonthlyProjectUpdateItem[] | MonthlyProjectUpdateItem | null>({
    queryKey: year && month ? queryKeys.monthlyUpdates.byMonth(year, month) : queryKeys.monthlyUpdates.all,
    queryFn: async () => {
      let url = "/api/monthly-updates";
      if (year && month) url += `?year=${year}&month=${month}`;
      else if (year) url += `?year=${year}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao buscar atualizações do projeto.");
      }
      return json.data;
    },
  });
}

export function useUpdateMonthlyUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MonthlyProjectUpdateInput) => {
      const res = await fetch("/api/monthly-updates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Erro ao atualizar relatório mensal.");
      }
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.monthlyUpdates.all });
    },
  });
}
