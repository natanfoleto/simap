import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export interface AuditLogParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Registra um evento de auditoria no sistema
 */
export async function recordAuditLog(
  params: AuditLogParams,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  try {
    return await client.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValues: params.oldValues ? (params.oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValues: params.newValues ? (params.newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("❌ Falha ao gravar log de auditoria:", error);
    // Em caso de falha de auditoria durante transação, propaga o erro para garantir integridade
    if (tx) throw error;
    return null;
  }
}
