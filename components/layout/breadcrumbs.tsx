"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  veiculos: "Frota de Veículos",
  novo: "Novo Cadastro",
  importar: "Importar CSV",
  "planos-preventivos": "Planos Preventivos",
  administracao: "Administração",
  projeto: "Marcos e Metas do Projeto",
  usuarios: "Usuários",
  permissoes: "Matriz de Permissões",
  auditoria: "Logs de Auditoria",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // O primeiro segmento é o tenantSlug (ex: jaborandi-sp)
  const tenantSlug = segments[0] || "jaborandi-sp";
  const appSegments = segments.slice(1);

  if (appSegments.length === 0 || appSegments[0] === "login") {
    return null;
  }

  let accumulatedPath = `/${tenantSlug}`;

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
      <Link
        href={`/${tenantSlug}/dashboard`}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Início</span>
      </Link>

      {appSegments.map((segment) => {
        accumulatedPath += `/${segment}`;
        const name = routeNames[segment] || (segment.length > 15 ? `${segment.slice(0, 10)}...` : segment);

        return (
          <div key={accumulatedPath} className="flex items-center space-x-2">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <Link
              href={accumulatedPath}
              className="hover:text-foreground transition-colors"
            >
              {name}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
