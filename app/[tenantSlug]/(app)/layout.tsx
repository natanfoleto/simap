import { redirect } from "next/navigation";
import { getSessionWithPermissions } from "@/lib/auth";
import { requireTenantAccess } from "@/lib/tenant";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const session = await getSessionWithPermissions();

  if (!session?.user) {
    redirect(`/${params.tenantSlug}/login`);
  }

  const accessError = requireTenantAccess(session.user, params.tenantSlug);
  if (accessError) {
    // Se o usuário não tem acesso a este tenant, redireciona para seu próprio tenant ou login
    const targetSlug = session.user.tenantSlug || "jaborandi-sp";
    if (params.tenantSlug !== targetSlug) {
      redirect(`/${targetSlug}/dashboard`);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Sidebar Lateral */}
        <Sidebar tenantSlug={params.tenantSlug} />

        {/* Área Principal de Conteúdo 100% Full Width */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Header />
          <main className="flex-1 p-6 md:p-8 w-full space-y-6 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
