import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export function usePilotGroups() {
  return useQuery({
    queryKey: queryKeys.pilot.list(),
    queryFn: async () => {
      const res = await fetch("/api/pilot-groups");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar grupos pilotos.");
      return json.data;
    },
  });
}

export function useCreatePilotGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      startDate: string | Date;
      endDate?: string | Date | null;
      notes?: string | null;
      vehicleIds: string[];
    }) => {
      const res = await fetch("/api/pilot-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao criar grupo piloto.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pilot.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}
