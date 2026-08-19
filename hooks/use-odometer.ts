import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { OdometerReadingInput } from "@/lib/validations";

interface OdometerQueryParams {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  vehicleId?: string;
}

export function useOdometerReadings(params: OdometerQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.vehicleId) queryParams.set("vehicleId", params.vehicleId);

  return useQuery({
    queryKey: queryKeys.odometer.list(params),
    queryFn: async () => {
      const res = await fetch(`/api/odometer-readings?${queryParams.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar leituras de hodômetro.");
      return json.data;
    },
  });
}

export function useRegisterOdometer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OdometerReadingInput) => {
      const res = await fetch("/api/odometer-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao registrar hodômetro.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.odometer.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}
