"use client";

import Link from "next/link";
import { useProject } from "@/hooks/use-project";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatPercentage } from "@/lib/formatters";
import {
  Truck,
  CalendarCheck,
  ClipboardCheck,
  Wrench,
  Gauge,
  ShieldCheck,
  TrendingDown,
  Plus,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

export default function DashboardPage({ params }: { params: { tenantSlug: string } }) {
  const { data, isLoading } = useProject();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalVehicles: 0,
    activeVehicles: 0,
    inactiveVehicles: 0,
    expectedFleetTotal: 97,
    registrationCoveragePercentage: 0,
    overallProgress: 100,
  };

  const settings = data?.settings || {
    baselineYear: 2025,
    baselineAmount: 285000,
    targetReductionPercentage: 20,
    calculatedTargetSavings: 57000,
  };

  const operationalModules = [
    {
      title: "Veículos da Frota",
      description: "Consulta geral, classificação por setor/categoria, histórico e cadastro.",
      href: `/${params.tenantSlug}/veiculos`,
      icon: Truck,
      color: "text-primary",
      bgColor: "bg-primary/10",
      stats: `${stats.totalVehicles} cadastrados`,
    },
    {
      title: "Planos Preventivos",
      description: "Intervalos por km e tempo para revisões, troca de óleo, freios e suspensão.",
      href: `/${params.tenantSlug}/planos-preventivos`,
      icon: CalendarCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      stats: "Configuração por categoria",
    },
    {
      title: "Checklists & Vistorias",
      description: "Inspeções pré-operação diárias realizadas por motoristas e operadores.",
      href: `/${params.tenantSlug}/checklists`,
      icon: ClipboardCheck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      stats: "Vistorias diárias",
    },
    {
      title: "Ordens de Serviço (OS)",
      description: "Abertura, acompanhamento de execução e controle de custos de manutenção.",
      href: `/${params.tenantSlug}/ordens-servico`,
      icon: Wrench,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      stats: "Preventivas e Corretivas",
    },
    {
      title: "Controle de Quilometragem",
      description: "Registro de leituras de hodômetro, controle de rodagem e prevenção de regressão.",
      href: `/${params.tenantSlug}/quilometragem`,
      icon: Gauge,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      stats: "Histórico auditável",
    },
    {
      title: "Grupo Piloto Prioritário",
      description: "Acompanhamento focado dos veículos essenciais de transporte escolar e saúde.",
      href: `/${params.tenantSlug}/piloto`,
      icon: ShieldCheck,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10",
      stats: "Monitoramento intensivo",
    },
    {
      title: "Visão Financeira & KPIs",
      description: "Custos consolidados, proporção preventiva vs corretiva e custo por km.",
      href: `/${params.tenantSlug}/financeiro`,
      icon: BarChart3,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      stats: "Mês 4 (R2)",
    },
    {
      title: "Orçamento Anual",
      description: "Planejamento orçamentário anual, linha de base e meta de 20% de economia.",
      href: `/${params.tenantSlug}/financeiro/orcamento`,
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      stats: "Planejado vs Realizado",
    },
    {
      title: "Inconsistências de Dados",
      description: "Auditoria de OS sem custos, odômetros pendentes e paradas em aberto.",
      href: `/${params.tenantSlug}/inconsistencias`,
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      stats: "Qualidade de dados",
    },
  ];


  return (
    <div className="space-y-8">
      {/* Top Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Painel de Controle Municipal
            </h1>
            <Badge variant="default" className="text-xs">
              Jaborandi/SP
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão estratégica e operacional da frota municipal e manutenção preventiva
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${params.tenantSlug}/veiculos/novo`}>
            <Button className="rounded-2xl gap-2 shadow-md shadow-primary/20">
              <Plus className="h-4 w-4" />
              Novo Veículo
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerta de Cobertura de Dados */}
      {stats.totalVehicles < stats.expectedFleetTotal && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Inventário Parcial da Frota</h4>
              <p className="text-xs opacity-90">
                {stats.totalVehicles} de {stats.expectedFleetTotal} veículos cadastrados ({formatPercentage(stats.registrationCoveragePercentage)} de cobertura).
              </p>
            </div>
          </div>
          <Link href={`/${params.tenantSlug}/veiculos/novo`}>
            <Button variant="outline" size="sm" className="rounded-xl border-amber-500/30 hover:bg-amber-500/20 whitespace-nowrap">
              Cadastrar veículo
            </Button>
          </Link>
        </div>
      )}

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Frota */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frota Cadastrada</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{stats.totalVehicles}</span>
              <span className="text-xs text-muted-foreground">/ {stats.expectedFleetTotal} esperados</span>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>Ativos: {stats.activeVehicles}</span>
                <span>{formatPercentage(stats.registrationCoveragePercentage)}</span>
              </div>
              <Progress value={stats.registrationCoveragePercentage} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Linha de Base Financeira */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Linha de Base ({settings.baselineYear})</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{formatBRL(settings.baselineAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gasto anual histórico em manutenção corretiva
            </p>
          </CardContent>
        </Card>

        {/* Meta de Redução */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta de Economia</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {settings.targetReductionPercentage}%
              </span>
              <span className="text-xs font-semibold text-emerald-600/80">
                ({formatBRL(settings.calculatedTargetSavings)})
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Economia projetada com prevenção e controle
            </p>
          </CardContent>
        </Card>

        {/* Disponibilidade Operacional */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Disponibilidade da Frota</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {stats.totalVehicles > 0 ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 100}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Operacional</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeVehicles} veículos aptos para operação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Módulos de Operação e Gestão */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Módulos da Gestão de Frotas</h2>
            <p className="text-xs text-muted-foreground">Acesso rápido aos fluxos operacionais e preventivos da prefeitura</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {operationalModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href} className="group">
                <Card className="h-full rounded-3xl border-border/40 bg-card/30 backdrop-blur-md transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md flex flex-col justify-between">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${mod.bgColor} ${mod.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">
                        {mod.stats}
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                      {mod.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {mod.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="flex items-center text-xs font-semibold text-primary pt-3 border-t border-border/20 gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Acessar módulo</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
