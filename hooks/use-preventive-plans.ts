import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { PreventivePlanInput } from "@/lib/validations";

export function usePreventivePlans(category?: string) {
  return useQuery({
    queryKey: queryKeys.preventivePlans.list(category),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (category) searchParams.set("category", category);

      const res = await fetch(`/api/preventive-plans?${searchParams.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao carregar planos preventivos");
      return json.data;
    },
  });
}

export function usePreventivePlan(id: string) {
  return useQuery({
    queryKey: queryKeys.preventivePlans.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/preventive-plans/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao carregar plano");
      return json.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePreventivePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PreventivePlanInput) => {
      const res = await fetch("/api/preventive-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao criar plano preventivo");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preventivePlans.all });
    },
  });
}

export function useUpdatePreventivePlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PreventivePlanInput) => {
      const res = await fetch(`/api/preventive-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao atualizar plano preventivo");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preventivePlans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.preventivePlans.detail(id) });
    },
  });
}

export function useAssignPlanToVehicles(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicleIds: string[]) => {
      const res = await fetch(`/api/preventive-plans/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleIds }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao vincular veículos");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preventivePlans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.preventivePlans.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}
