import type { DefaultSession, DefaultUser } from "next-auth";
import type { Role } from "@prisma/client";
import type { UserPermissionItem } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      tenantId: string | null;
      tenantSlug: string | null;
      tenantName: string | null;
      permissions: UserPermissionItem[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    permissions: UserPermissionItem[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    permissions: UserPermissionItem[];
  }
}
