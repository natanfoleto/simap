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
  validationErrorResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "usuarios", "gerenciar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;

    const users = await prisma.user.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        permissions: {
          select: {
            id: true,
            module: true,
            action: true,
            granted: true,
          },
        },
      },
    });

    return apiSuccess(users);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "usuarios", "gerenciar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.format());
    }

    const data = parsed.data;

    if (!data.password) {
      return validationErrorResponse("A senha é obrigatória para criação de novo usuário.");
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return conflictResponse("Já existe um usuário cadastrado com este e-mail.");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as Role,
        active: data.active,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await recordAuditLog({
      tenantId,
      userId: session.user.id,
      action: "CRIAR_USUARIO",
      entity: "User",
      entityId: user.id,
      newValues: { id: user.id, email: user.email, role: user.role },
    });

    return apiSuccess(user, "Usuário criado com sucesso", 201);
  } catch (error) {
    console.error("POST /api/users error:", error);
    return internalErrorResponse();
  }
}
