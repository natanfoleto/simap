import { forbiddenResponse, unauthorizedResponse } from "./api-helpers";

export interface SessionUserContext {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
}

/**
 * Valida se a sessão do usuário possui acesso ao tenant solicitado
 */
export function requireTenantAccess(
  sessionUser: SessionUserContext | null | undefined,
  targetTenantIdOrSlug: string
) {
  if (!sessionUser) {
    return unauthorizedResponse("Sessão expirada ou não autenticada.");
  }

  // Administrador global (sem tenantId fixo) tem acesso autorizado
  if (sessionUser.role === "ADMIN" && !sessionUser.tenantId) {
    return null;
  }

  // Verifica se coincide pelo ID ou pelo Slug do Tenant
  const matchesId = sessionUser.tenantId === targetTenantIdOrSlug;
  const matchesSlug = sessionUser.tenantSlug === targetTenantIdOrSlug;

  if (!matchesId && !matchesSlug) {
    return forbiddenResponse("Acesso negado: você não possui permissão para acessar esta organização.");
  }

  return null;
}

/**
 * Retorna o filtro de tenant para inclusão obrigatória nas queries Prisma
 */
export function getTenantScopeFilter(sessionUser: SessionUserContext) {
  if (sessionUser.role === "ADMIN" && !sessionUser.tenantId) {
    return {};
  }
  if (!sessionUser.tenantId) {
    throw new Error("Usuário operacional sem tenant vinculado.");
  }
  return { tenantId: sessionUser.tenantId };
}

/**
 * Garante que a entidade pertence ao tenant da sessão ativa
 */
export function assertEntityBelongsToTenant(
  entityTenantId: string,
  sessionTenantId: string | null | undefined
): boolean {
  if (!sessionTenantId) return true; // Global admin
  return entityTenantId === sessionTenantId;
}
