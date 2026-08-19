import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { MaintenanceOrderInput } from "@/lib/validations";

interface OrdersQueryParams {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  vehicleId?: string;
  type?: string;
  status?: string;
  priority?: string;
}

export function useMaintenanceOrders(params: OrdersQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.vehicleId) queryParams.set("vehicleId", params.vehicleId);
  if (params.type) queryParams.set("type", params.type);
  if (params.status) queryParams.set("status", params.status);
  if (params.priority) queryParams.set("priority", params.priority);

  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: async () => {
      const res = await fetch(`/api/maintenance-orders?${queryParams.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar ordens de serviço.");
      return json.data;
    },
  });
}

export function useMaintenanceOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/maintenance-orders/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar ordem de serviço.");
      return json.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateMaintenanceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaintenanceOrderInput) => {
      const res = await fetch("/api/maintenance-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao criar ordem de serviço.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}

export function useUpdateMaintenanceOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/maintenance-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao atualizar ordem de serviço.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}

export function useCancelMaintenanceOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/maintenance-orders/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao cancelar ordem de serviço.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}
