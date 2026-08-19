import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export interface ProjectSettingsInput {
  baselineYear: number;
  baselineAmount: number;
  targetReductionPercentage: number;
}

export function useProject() {
  return useQuery({
    queryKey: queryKeys.project.summary,
    queryFn: async () => {
      const res = await fetch("/api/project");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao carregar dados do projeto");
      return json.data;
    },
  });
}

export function useUpdateProjectSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProjectSettingsInput) => {
      const res = await fetch("/api/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao atualizar configurações");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project.summary });
    },
  });
}
