import { describe, it, expect } from "vitest";
import { requireTenantAccess, getTenantScopeFilter, assertEntityBelongsToTenant } from "@/lib/tenant";

describe("Isolamento Multi-tenant e Segurança de Escopo", () => {
  it("deve permitir acesso quando o tenantSlug coincide com o da sessão", () => {
    const sessionUser = {
      id: "usr_123",
      name: "Operador Jaborandi",
      email: "operador@jaborandi.sp.gov.br",
      role: "OPERADOR",
      tenantId: "tenant_jaborandi_1",
      tenantSlug: "jaborandi-sp",
    };

    const error = requireTenantAccess(sessionUser, "jaborandi-sp");
    expect(error).toBeNull();
  });

  it("deve bloquear acesso quando o usuário tenta acessar outro tenant", () => {
    const sessionUser = {
      id: "usr_123",
      name: "Operador Jaborandi",
      email: "operador@jaborandi.sp.gov.br",
      role: "OPERADOR",
      tenantId: "tenant_jaborandi_1",
      tenantSlug: "jaborandi-sp",
    };

    const error = requireTenantAccess(sessionUser, "outro-municipio");
    expect(error).not.toBeNull();
  });

  it("deve permitir acesso irrestrito para SuperAdmin global (sem tenantId fixo)", () => {
    const globalAdmin = {
      id: "usr_superadmin",
      name: "SuperAdmin Global",
      email: "superadmin@simap.gov.br",
      role: "ADMIN",
      tenantId: null,
      tenantSlug: null,
    };

    const error = requireTenantAccess(globalAdmin, "jaborandi-sp");
    expect(error).toBeNull();
  });

  it("deve gerar filtro Prisma restrito para usuário comum", () => {
    const sessionUser = {
      id: "usr_123",
      name: "Operador Jaborandi",
      email: "operador@jaborandi.sp.gov.br",
      role: "OPERADOR",
      tenantId: "tenant_jaborandi_1",
      tenantSlug: "jaborandi-sp",
    };

    const filter = getTenantScopeFilter(sessionUser);
    expect(filter).toEqual({ tenantId: "tenant_jaborandi_1" });
  });

  it("deve validar pertencimento de entidade ao tenant correto", () => {
    expect(assertEntityBelongsToTenant("tenant_1", "tenant_1")).toBe(true);
    expect(assertEntityBelongsToTenant("tenant_1", "tenant_2")).toBe(false);
  });
});
