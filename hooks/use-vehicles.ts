import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { VehicleInput } from "@/lib/validations";
import { ValidatedVehicleRow } from "@/app/api/vehicles/import/route";

interface VehiclesQueryParams {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  tenantSlug?: string;
}

export interface VehicleItem {
  id: string;
  fleetCode: string;
  plate: string;
  category: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  purpose: string;
  department?: string | null;
  criticality: string;
  status: string;
  currentOdometer: number;
  isPilot: boolean;
  active: boolean;
  notes?: string | null;
  createdAt: string;
  preventivePlans?: Array<{
    plan: {
      id: string;
      name: string;
      category: string;
      version: number;
      items: Array<{
        id: string;
        name: string;
        intervalKm?: number;
        intervalDays?: number;
        priority: string;
      }>;
    };
  }>;
}

export interface VehiclesResponse {
  items: VehicleItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useVehicles(params: VehiclesQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search);
  if (params.category) queryParams.set("category", params.category);
  if (params.status) queryParams.set("status", params.status);
  if (params.tenantSlug) queryParams.set("tenantSlug", params.tenantSlug);

  return useQuery<VehiclesResponse>({
    queryKey: queryKeys.vehicles.list(params),
    queryFn: async () => {
      const res = await fetch(`/api/vehicles?${queryParams.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar veículos.");
      return json.data;
    },
  });
}

export function useVehicle(id: string) {
  return useQuery<VehicleItem>({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao carregar veículo.");
      return json.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: VehicleInput) => {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao cadastrar veículo");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.project.summary });
    },
  });
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: VehicleInput) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao atualizar veículo");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao inativar veículo");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.project.summary });
    },
  });
}

export function useImportVehiclesPreview() {
  return useMutation({
    mutationFn: async (csvContent: string) => {
      const res = await fetch("/api/vehicles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", csvContent }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro na validação do CSV");
      return json.data;
    },
  });
}

export function useImportVehiclesCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (confirmedVehicles: ValidatedVehicleRow[]) => {
      const res = await fetch("/api/vehicles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", confirmedVehicles }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro na importação dos veículos");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.project.summary });
    },
  });
}
