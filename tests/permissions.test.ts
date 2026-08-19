import { describe, it, expect } from "vitest";
import { hasPermission } from "@/lib/permissions";
import { Role } from "@prisma/client";

describe("Matriz RBAC e Permissões Granulares", () => {
  it("ADMIN deve possuir todas as permissões essenciais por padrão", () => {
    expect(hasPermission(Role.ADMIN, "veiculos", "criar")).toBe(true);
    expect(hasPermission(Role.ADMIN, "planos", "publicar")).toBe(true);
    expect(hasPermission(Role.ADMIN, "usuarios", "gerenciar")).toBe(true);
    expect(hasPermission(Role.ADMIN, "auditoria", "ver")).toBe(true);
  });

  it("MOTORISTA não deve ter permissão para gerenciar usuários ou criar planos", () => {
    expect(hasPermission(Role.MOTORISTA, "usuarios", "gerenciar")).toBe(false);
    expect(hasPermission(Role.MOTORISTA, "planos", "criar")).toBe(false);
    expect(hasPermission(Role.MOTORISTA, "veiculos", "inativar")).toBe(false);
  });

  it("MOTORISTA deve poder registrar quilometragem e executar checklists", () => {
    expect(hasPermission(Role.MOTORISTA, "quilometragem", "registrar")).toBe(true);
    expect(hasPermission(Role.MOTORISTA, "checklists", "executar")).toBe(true);
  });

  it("AUDITOR deve ter acesso de leitura e auditoria mas não de mutação operacional", () => {
    expect(hasPermission(Role.AUDITOR, "auditoria", "ver")).toBe(true);
    expect(hasPermission(Role.AUDITOR, "veiculos", "ver")).toBe(true);
    expect(hasPermission(Role.AUDITOR, "veiculos", "criar")).toBe(false);
    expect(hasPermission(Role.AUDITOR, "veiculos", "inativar")).toBe(false);
  });

  it("deve respeitar override customizado de permissão concedida", () => {
    const overrides = [{ module: "planos", action: "criar", granted: true }];
    expect(hasPermission(Role.OPERADOR, "planos", "criar", overrides)).toBe(true);
  });

  it("deve respeitar override customizado de permissão revogada", () => {
    const overrides = [{ module: "veiculos", action: "criar", granted: false }];
    expect(hasPermission(Role.GESTOR, "veiculos", "criar", overrides)).toBe(false);
  });
});
