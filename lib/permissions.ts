import { Role } from "@prisma/client";

export type ModuleName =
  | "dashboard"
  | "veiculos"
  | "quilometragem"
  | "planos"
  | "checklists"
  | "ordens"
  | "financeiro"
  | "relatorios"
  | "recomendacoes"
  | "usuarios"
  | "auditoria"
  | "projeto";

export type PermissionKey =
  | "dashboard:ver"
  | "veiculos:ver"
  | "veiculos:criar"
  | "veiculos:editar"
  | "veiculos:inativar"
  | "quilometragem:ver"
  | "quilometragem:registrar"
  | "quilometragem:corrigir"
  | "planos:ver"
  | "planos:criar"
  | "planos:editar"
  | "planos:publicar"
  | "checklists:ver"
  | "checklists:executar"
  | "checklists:gerenciar"
  | "ordens:ver"
  | "ordens:criar"
  | "ordens:editar"
  | "ordens:concluir"
  | "ordens:cancelar"
  | "ordens:corrigir"
  | "ordens:excluir_forcado"
  | "financeiro:ver"
  | "financeiro:editar"
  | "relatorios:ver"
  | "relatorios:gerar"
  | "relatorios:publicar"
  | "recomendacoes:ver"
  | "recomendacoes:criar"
  | "recomendacoes:aprovar"
  | "usuarios:gerenciar"
  | "auditoria:ver"
  | "projeto:ver"
  | "projeto:editar";

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, PermissionKey[]> = {
  ADMIN: [
    "dashboard:ver",
    "veiculos:ver",
    "veiculos:criar",
    "veiculos:editar",
    "veiculos:inativar",
    "quilometragem:ver",
    "quilometragem:registrar",
    "quilometragem:corrigir",
    "planos:ver",
    "planos:criar",
    "planos:editar",
    "planos:publicar",
    "checklists:ver",
    "checklists:executar",
    "checklists:gerenciar",
    "ordens:ver",
    "ordens:criar",
    "ordens:editar",
    "ordens:concluir",
    "ordens:cancelar",
    "ordens:corrigir",
    "ordens:excluir_forcado",
    "financeiro:ver",
    "financeiro:editar",
    "relatorios:ver",
    "relatorios:gerar",
    "relatorios:publicar",
    "recomendacoes:ver",
    "recomendacoes:criar",
    "recomendacoes:aprovar",
    "usuarios:gerenciar",
    "auditoria:ver",
    "projeto:ver",
    "projeto:editar",
  ],
  GESTOR: [
    "dashboard:ver",
    "veiculos:ver",
    "veiculos:criar",
    "veiculos:editar",
    "veiculos:inativar",
    "quilometragem:ver",
    "quilometragem:registrar",
    "quilometragem:corrigir",
    "planos:ver",
    "planos:criar",
    "planos:editar",
    "planos:publicar",
    "checklists:ver",
    "checklists:executar",
    "checklists:gerenciar",
    "ordens:ver",
    "ordens:criar",
    "ordens:editar",
    "ordens:concluir",
    "ordens:cancelar",
    "ordens:corrigir",
    "financeiro:ver",
    "financeiro:editar",
    "relatorios:ver",
    "relatorios:gerar",
    "relatorios:publicar",
    "recomendacoes:ver",
    "recomendacoes:criar",
    "recomendacoes:aprovar",
    "auditoria:ver",
    "projeto:ver",
  ],
  OPERADOR: [
    "dashboard:ver",
    "veiculos:ver",
    "veiculos:editar",
    "quilometragem:ver",
    "quilometragem:registrar",
    "planos:ver",
    "checklists:ver",
    "checklists:executar",
    "ordens:ver",
    "ordens:criar",
    "ordens:editar",
    "ordens:concluir",
    "projeto:ver",
  ],
  MOTORISTA: [
    "quilometragem:ver",
    "quilometragem:registrar",
    "checklists:ver",
    "checklists:executar",
  ],
  AUDITOR: [
    "dashboard:ver",
    "veiculos:ver",
    "quilometragem:ver",
    "planos:ver",
    "checklists:ver",
    "ordens:ver",
    "financeiro:ver",
    "relatorios:ver",
    "recomendacoes:ver",
    "auditoria:ver",
    "projeto:ver",
  ],
};

export type UserPermissionItem = {
  module: string;
  action: string;
  granted: boolean;
};

/**
 * Avalia se o usuário possui determinada permissão considerando seu Role padrão e overrides
 */
export function hasPermission(
  role: Role,
  module: string,
  action: string,
  userOverrides: UserPermissionItem[] = []
): boolean {
  // 1. Verifica se há override explícito para este usuário
  const override = userOverrides.find(
    (o) => o.module === module && o.action === action
  );
  if (override !== undefined) {
    return override.granted;
  }

  // 2. Avalia a permissão padrão do Role
  const permissionKey = `${module}:${action}` as PermissionKey;
  const defaultList = ROLE_DEFAULT_PERMISSIONS[role] || [];
  return defaultList.includes(permissionKey);
}
