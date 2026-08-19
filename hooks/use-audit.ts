import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface AuditQueryParams {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  search?: string;
}

export function useAuditLogs(params: AuditQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.action) searchParams.set("action", params.action);
      if (params.entity) searchParams.set("entity", params.entity);
      if (params.search) searchParams.set("search", params.search);

      const res = await fetch(`/api/audit?${searchParams.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erro ao carregar logs de auditoria");
      return json.data;
    },
  });
}
