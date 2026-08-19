"use client";

import Link from "next/link";
import { useProject } from "@/hooks/use-project";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatPercentage, formatUTCDate } from "@/lib/formatters";
import {
  Truck,
  CheckCircle2,
  Clock,
  TrendingDown,
  FileSpreadsheet,
  Plus,
  AlertTriangle,
  CalendarCheck,
  Building,
  DollarSign,
  ArrowRight,
  ShieldCheck,
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
    overallProgress: 25,
  };

  const settings = data?.settings || {
    baselineYear: 2025,
    baselineAmount: 285000,
    targetReductionPercentage: 20,
    calculatedTargetSavings: 57000,
  };

  const milestones = data?.milestones || [];

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
            Acompanhamento do Programa Pro Inova — Sistema Municipal de Manutenção Preventiva
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${params.tenantSlug}/veiculos/importar`}>
            <Button variant="outline" className="rounded-2xl gap-2 shadow-sm">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Importar Frota (CSV)
            </Button>
          </Link>
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
                {stats.totalVehicles} de {stats.expectedFleetTotal} veículos cadastrados ({formatPercentage(stats.registrationCoveragePercentage)} de cobertura). Importe a planilha oficial para completar o diagnóstico.
              </p>
            </div>
          </div>
          <Link href={`/${params.tenantSlug}/veiculos/importar`}>
            <Button variant="outline" size="sm" className="rounded-xl border-amber-500/30 hover:bg-amber-500/20 whitespace-nowrap">
              Importar agora
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
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta de Redução</span>
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

        {/* Progresso do Pro Inova */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Programa Pro Inova</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">2 / 8</span>
              <span className="text-xs text-muted-foreground">meses validados</span>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>Progresso Oficial</span>
                <span>{formatPercentage(stats.overallProgress)}</span>
              </div>
              <Progress value={stats.overallProgress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status dos 8 Marcos Institucionais */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="border-b border-border/30 p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground/90">
              Cronograma de Entregas Oficiais (8 Meses)
            </CardTitle>
            <CardDescription>
              Marcos do programa Pro Inova para implementação de manutenção preventiva no transporte municipal
            </CardDescription>
          </div>
          <Link href={`/${params.tenantSlug}/administracao/projeto`}>
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5 text-xs">
              Ver detalhes do projeto
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {milestones.map((m: {
              id: string;
              monthNumber: number;
              title: string;
              deliverable: string;
              status: string;
              completionPercentage: number;
              validatedAt?: string;
            }) => {
              const isValidated = m.status === "VALIDADO";
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isValidated
                      ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "border-border/40 bg-card/40 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      Mês {m.monthNumber}
                    </span>
                    {isValidated ? (
                      <Badge variant="success" className="text-[10px] gap-1 py-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        100% VALIDADO
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px] gap-1 py-0.5">
                        <Clock className="h-3 w-3" />
                        PENDENTE
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1 mb-1">{m.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.deliverable}</p>
                  {isValidated && m.validatedAt && (
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Validado em {formatUTCDate(m.validatedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ações e Módulos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href={`/${params.tenantSlug}/veiculos`} className="group">
          <Card className="h-full rounded-3xl border-border/40 bg-card/30 backdrop-blur-md transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Gestão da Frota</CardTitle>
                  <CardDescription className="text-xs">Consulta, filtros e cadastro dos veículos</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/${params.tenantSlug}/planos-preventivos`} className="group">
          <Card className="h-full rounded-3xl border-border/40 bg-card/30 backdrop-blur-md transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Planos Preventivos</CardTitle>
                  <CardDescription className="text-xs">Intervalos por tempo, km e vinculação</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/${params.tenantSlug}/administracao/projeto`} className="group">
          <Card className="h-full rounded-3xl border-border/40 bg-card/30 backdrop-blur-md transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 group-hover:scale-105 transition-transform">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Configurações & Metas</CardTitle>
                  <CardDescription className="text-xs">Linha de base orçamentária e cronograma</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
