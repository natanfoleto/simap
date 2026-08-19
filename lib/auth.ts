import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/jaborandi-sp/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais SIMAP",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
        tenantSlug: { label: "Organização", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenant: true,
            permissions: {
              select: {
                module: true,
                action: true,
                granted: true,
              },
            },
          },
        });

        const ipAddress = req?.headers ? (req.headers["x-forwarded-for"] as string)?.split(",")[0] || null : null;
        const userAgent = req?.headers ? (req.headers["user-agent"] as string) || null : null;

        if (!user || !user.active) {
          await prisma.loginLog.create({
            data: {
              email,
              tenantId: null,
              userId: user?.id || null,
              success: false,
              reason: !user ? "USUARIO_NAO_ENCONTRADO" : "USUARIO_INATIVO",
              ipAddress,
              userAgent,
            },
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          await prisma.loginLog.create({
            data: {
              email,
              tenantId: user.tenantId,
              userId: user.id,
              success: false,
              reason: "SENHA_INVALIDA",
              ipAddress,
              userAgent,
            },
          });
          return null;
        }

        // Se o usuário estiver vinculado a um tenant inativo, bloqueia
        if (user.tenant && !user.tenant.active) {
          await prisma.loginLog.create({
            data: {
              email,
              tenantId: user.tenantId,
              userId: user.id,
              success: false,
              reason: "TENANT_INATIVO",
              ipAddress,
              userAgent,
            },
          });
          return null;
        }

        // Registra login bem-sucedido
        await prisma.loginLog.create({
          data: {
            email,
            tenantId: user.tenantId,
            userId: user.id,
            success: true,
            reason: "SUCESSO",
            ipAddress,
            userAgent,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug || null,
          tenantName: user.tenant?.name || null,
          permissions: user.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.tenantSlug = token.tenantSlug;
        session.user.tenantName = token.tenantName;
        session.user.permissions = token.permissions || [];
      }
      return session;
    },
  },
};

/**
 * Retorna a sessão ativa no servidor com as permissões do usuário
 */
export async function getSessionWithPermissions() {
  const session = await getServerSession(authOptions);
  return session;
}
