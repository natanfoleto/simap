"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Truck,
  CalendarCheck,
  Building2,
  FolderGit2,
  Users,
  ScrollText,
  Wrench,
  Gauge,
  ClipboardCheck,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

export function Sidebar({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Fecha o drawer mobile ao navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  const navGroups = [
    {
      title: "Geral",
      items: [
        {
          label: "Dashboard",
          href: `/${tenantSlug}/dashboard`,
          icon: LayoutDashboard,
          active: pathname === `/${tenantSlug}/dashboard`,
        },
      ],
    },
    {
      title: "Frota & Preventiva",
      items: [
        {
          label: "Veículos da Frota",
          href: `/${tenantSlug}/veiculos`,
          icon: Truck,
          active: pathname.startsWith(`/${tenantSlug}/veiculos`),
        },
        {
          label: "Planos Preventivos",
          href: `/${tenantSlug}/planos-preventivos`,
          icon: CalendarCheck,
          active: pathname.startsWith(`/${tenantSlug}/planos-preventivos`),
        },
      ],
    },
    {
      title: "Operação Controlada",
      items: [
        {
          label: "Quilometragem",
          href: `/${tenantSlug}/quilometragem`,
          icon: Gauge,
          active: pathname.startsWith(`/${tenantSlug}/quilometragem`),
        },
        {
          label: "Checklists Diários",
          href: `/${tenantSlug}/checklists`,
          icon: ClipboardCheck,
          active: pathname.startsWith(`/${tenantSlug}/checklists`),
        },
        {
          label: "Ordens de Serviço",
          href: `/${tenantSlug}/ordens-servico`,
          icon: Wrench,
          active: pathname.startsWith(`/${tenantSlug}/ordens-servico`),
        },
        {
          label: "Grupo Piloto",
          href: `/${tenantSlug}/piloto`,
          icon: ShieldAlert,
          active: pathname.startsWith(`/${tenantSlug}/piloto`),
        },
      ],
    },
    {
      title: "Administração",
      items: [
        {
          label: "Parâmetros da Frota",
          href: `/${tenantSlug}/administracao/projeto`,
          icon: FolderGit2,
          active: pathname === `/${tenantSlug}/administracao/projeto`,
        },
        {
          label: "Usuários & Acessos",
          href: `/${tenantSlug}/administracao/usuarios`,
          icon: Users,
          active: pathname === `/${tenantSlug}/administracao/usuarios`,
          adminOnly: true,
        },
        {
          label: "Auditoria do Sistema",
          href: `/${tenantSlug}/administracao/auditoria`,
          icon: ScrollText,
          active: pathname === `/${tenantSlug}/administracao/auditoria`,
          adminOrAuditor: true,
        },
      ],
    },
  ];

  const tenantName = session?.user?.tenantName || "Município de Jaborandi/SP";

  return (
    <>
      {/* Backdrop para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex-shrink-0 border-r border-border/40 bg-card/40 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-40",
          // Desktop styles
          "hidden md:flex",
          isCollapsed ? "w-20" : "w-64",
          // Mobile overrides when open
          isMobileOpen && "fixed inset-y-0 left-0 flex w-72 shadow-2xl z-50"
        )}
      >
        {/* Brand Header - Altura exata h-16 para alinhar perfeitamente com o Header */}
        <div
          className={cn(
            "h-16 flex-shrink-0 border-b border-border/30 flex items-center px-4",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href={`/${tenantSlug}/dashboard`}
            className={cn("flex items-center gap-3 group", isCollapsed && "justify-center")}
            title="SIMAP — Manutenção Preventiva"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Wrench className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-foreground leading-none">SIMAP</span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                  Manutenção Preventiva
                </span>
              </div>
            )}
          </Link>

          {/* Botão fechar em mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 rounded-xl"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tenant Indicator - Altura fixa h-11 */}
        <div
          className={cn(
            "h-11 flex-shrink-0 border-b border-border/20 bg-muted/20 flex items-center px-4",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          title={tenantName}
        >
          <div className={cn("flex items-center gap-2 text-xs text-muted-foreground overflow-hidden", isCollapsed && "justify-center")}>
            <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-semibold text-foreground/80 truncate">
                {tenantName}
              </span>
            )}
          </div>
        </div>

        {/* Navigation List - Flexível */}
        <div className={cn("flex-1 overflow-y-auto py-3 space-y-4", isCollapsed ? "px-2" : "px-3")}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (item.adminOnly && session?.user?.role !== "ADMIN" && session?.user?.role !== "GESTOR") {
                return false;
              }
              if (
                item.adminOrAuditor &&
                session?.user?.role !== "ADMIN" &&
                session?.user?.role !== "GESTOR" &&
                session?.user?.role !== "AUDITOR"
              ) {
                return false;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className={cn("h-5 flex items-center", isCollapsed ? "justify-center" : "px-3")}>
                  {!isCollapsed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 truncate">
                      {group.title}
                    </span>
                  ) : (
                    <div className="w-6 h-px bg-border/40" />
                  )}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center rounded-2xl text-sm font-medium h-10",
                          isCollapsed
                            ? "w-10 mx-auto justify-center p-0"
                            : "gap-3 px-3 py-2",
                          item.active
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            item.active ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer & Toggle Collapse Button - Altura fixa h-16 */}
        <div className={cn("h-16 flex-shrink-0 border-t border-border/20 flex items-center justify-center", isCollapsed ? "p-2" : "p-3")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/60 hidden md:flex items-center justify-center h-10 p-0"
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
