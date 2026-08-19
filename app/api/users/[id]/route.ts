import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";
import {
  apiSuccess,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "usuarios", "gerenciar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const existing = await prisma.user.findFirst({
      where: { id: params.id, tenantId },
      include: { permissions: true },
    });

    if (!existing) return notFoundResponse("Usuário não encontrado.");

    const body = await req.json().catch(() => null);
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    // Verificar se outro usuário tem o mesmo e-mail
    const duplicate = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: { not: params.id },
      },
    });

    if (duplicate) {
      return conflictResponse("Outro usuário já utiliza este e-mail.");
    }

    const updateData: {
      name: string;
      email: string;
      role: Role;
      active: boolean;
      passwordHash?: string;
    } = {
      name: data.name,
      email: data.email,
      role: data.role as Role,
      active: data.active,
    };

    if (data.password && data.password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(data.password.trim(), 10);
    }

    // Processar também permissões personalizadas se enviadas no corpo
    const customPermissions = body.permissions as Array<{ module: string; action: string; granted: boolean }> | undefined;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
        },
      });

      if (Array.isArray(customPermissions)) {
        await tx.userPermission.deleteMany({ where: { userId: params.id } });
        for (const p of customPermissions) {
          await tx.userPermission.create({
            data: {
              userId: params.id,
              module: p.module,
              action: p.action,
              granted: p.granted,
            },
          });
        }
      }

      await recordAuditLog(
        {
          tenantId,
          userId: session.user.id,
          action: "EDITAR_USUARIO",
          entity: "User",
          entityId: user.id,
          oldValues: { id: existing.id, email: existing.email, role: existing.role, active: existing.active },
          newValues: { ...user, permissionsCount: customPermissions?.length || 0 },
        },
        tx
      );

      return user;
    });

    return apiSuccess(updatedUser, "Usuário atualizado com sucesso");
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "usuarios", "gerenciar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    if (params.id === session.user.id) {
      return conflictResponse("Não é permitido inativar seu próprio usuário.");
    }

    const user = await prisma.user.findFirst({
      where: { id: params.id, tenantId },
    });

    if (!user) return notFoundResponse("Usuário não encontrado.");

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
    });

    await recordAuditLog({
      tenantId,
      userId: session.user.id,
      action: "INATIVAR_USUARIO",
      entity: "User",
      entityId: user.id,
      oldValues: user,
      newValues: updated,
    });

    return apiSuccess({ inativado: true }, "Usuário inativado com sucesso");
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return internalErrorResponse();
  }
}
