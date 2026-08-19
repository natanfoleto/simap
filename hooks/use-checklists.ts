import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { InspectionExecutionInput } from "@/lib/validations";

export function useChecklistTemplates(category?: string) {
  return useQuery({
    queryKey: queryKeys.checklists.templates(category),
    queryFn: async () => {
      const url = category
        ? `/api/checklists/templates?category=${encodeURIComponent(category)}`
        : "/api/checklists/templates";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar templates de checklist.");
      return json.data;
    },
  });
}

interface InspectionsQueryParams {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  vehicleId?: string;
}

export function useInspections(params: InspectionsQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.vehicleId) queryParams.set("vehicleId", params.vehicleId);

  return useQuery({
    queryKey: queryKeys.checklists.inspections(params),
    queryFn: async () => {
      const res = await fetch(`/api/checklists/inspections?${queryParams.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar inspeções.");
      return json.data;
    },
  });
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: queryKeys.checklists.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/checklists/inspections/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar detalhes da inspeção.");
      return json.data;
    },
    enabled: Boolean(id),
  });
}

export function useExecuteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InspectionExecutionInput) => {
      const res = await fetch("/api/checklists/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao registrar checklist.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checklists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.odometer.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}
