"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User as UserIcon, Shield } from "lucide-react";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const roleColors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "neutral"> = {
    ADMIN: "default",
    GESTOR: "success",
    OPERADOR: "warning",
    MOTORISTA: "neutral",
    AUDITOR: "secondary",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-11 rounded-2xl px-3 gap-2 hover:bg-muted/50 border border-border/30">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
            {session.user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col text-left text-xs">
            <span className="font-semibold leading-none text-foreground/90">{session.user.name}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{session.user.tenantName || "SIMAP"}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
            <div className="pt-2 flex items-center gap-1.5">
              <Badge variant={roleColors[session.user.role] || "default"}>
                <Shield className="h-3 w-3" />
                {session.user.role}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
            <UserIcon className="h-3.5 w-3.5" />
            <span>ID: {session.user.id.slice(0, 8)}...</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut({ callbackUrl: `/${session.user.tenantSlug || "jaborandi-sp"}/login` })}
        >
          <LogOut className="h-4 w-4" />
          <span>Sair do sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
