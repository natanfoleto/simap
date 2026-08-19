"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";

export function Sidebar({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();

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
      title: "Operação Controlada (M3)",
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
          label: "Projeto & Metas",
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

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-border/30">
        <Link href={`/${tenantSlug}/dashboard`} className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-foreground">SIMAP</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                R0
              </span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground line-clamp-1">
              Manutenção Preventiva
            </span>
          </div>
        </Link>
      </div>

      {/* Tenant Indicator */}
      <div className="px-5 py-3 border-b border-border/20 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground/80 truncate">
            {session?.user?.tenantName || "Município de Jaborandi/SP"}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.adminOnly && session?.user?.role !== "ADMIN" && session?.user?.role !== "GESTOR") {
              return false;
            }
            if (item.adminOrAuditor && session?.user?.role !== "ADMIN" && session?.user?.role !== "GESTOR" && session?.user?.role !== "AUDITOR") {
              return false;
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1.5">
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </h4>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                        item.active
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/25"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", item.active ? "text-primary-foreground" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border/20 text-[11px] text-muted-foreground/80 flex flex-col gap-0.5">
        <span className="font-medium text-foreground/80">Pro Inova — Transporte Público</span>
        <span>Jaborandi/SP • 8 Meses</span>
      </div>
    </aside>
  );
}
