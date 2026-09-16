"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useFinancial,
  useKpiSnapshots,
  useCreateKpiSnapshot,
  useMonthlyUpdates,
  useUpdateMonthlyUpdate,
  FinancialSummaryData,
  MonthlyProjectUpdateItem,
} from "@/hooks/use-financial";
import { generateFinancialReportPdf } from "@/lib/reports/financial-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, formatPercentage, formatUTCDate } from "@/lib/formatters";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileDown,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Gauge,
  Clock,
  Search,
  Wrench,
  ShieldCheck,
  ChevronRight,
  Filter,
  BarChart3,
  Edit3,
  Lightbulb,
  Sparkles,
  Info,
} from "lucide-react";
import { generateFleetFinancialInsights, FleetInsight } from "@/lib/domain/financial-indicators";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  ONIBUS: "#3b82f6",
  AMBULANCIA: "#ef4444",
  CAMINHAO: "#f59e0b",
  VAN: "#8b5cf6",
  CARRO: "#10b981",
  MAQUINA: "#6366f1",
  MOTOCICLETA: "#ec4899",
  OUTRO: "#64748b",
};

export default function FinancialDashboardPage({ params }: { params: { tenantSlug: string } }) {
  const { data: session } = useSession();
  const { toast } = useToast();

  // Estados de Filtros
  const [period, setPeriod] = useState<string>("year");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [pilotOnly, setPilotOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modais
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeMonth, setFreezeMonth] = useState<number>(new Date().getMonth() + 1);
  const [freezeYear, setFreezeYear] = useState<number>(new Date().getFullYear());
  const [freezeNotes, setFreezeNotes] = useState<string>("");

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [advancesSummary, setAdvancesSummary] = useState<string>("");
  const [nextSteps, setNextSteps] = useState<string>("");
  const [observations, setObservations] = useState<string>("");

  // Parâmetros da query
  const queryFilters: Record<string, unknown> = {
    period,
    category: selectedCategory !== "ALL" ? selectedCategory : undefined,
    department: selectedDepartment !== "ALL" ? selectedDepartment : undefined,
    pilotOnly: pilotOnly ? true : undefined,
  };

  const { data, isLoading } = useFinancial(queryFilters);
  const { data: snapshots, isLoading: loadingSnapshots } = useKpiSnapshots(freezeYear);
  const { data: monthlyUpdate } = useMonthlyUpdates(freezeYear, 4); // Mês 4 default
  const createSnapshotMutation = useCreateKpiSnapshot();
  const updateMonthlyMutation = useUpdateMonthlyUpdate();

  // Permissões
  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "GESTOR";

  // Exportação CSV
  const handleExportCSV = (financialData: FinancialSummaryData) => {
    const headers = [
      "Código",
      "Placa",
      "Categoria",
      "Modelo",
      "Departamento",
      "Km Rodado no Período",
      "Custo Total (R$)",
      "Custo Preventivo (R$)",
      "Custo Corretivo (R$)",
      "Total de OS",
      "Custo por Km (R$/km)",
    ];

    const rows = financialData.vehiclesSummary.map((v) => [
      v.fleetCode,
      v.plate,
      v.category,
      `"${v.model}"`,
      `"${v.department}"`,
      v.kmDriven,
      v.totalCost.toFixed(2),
      v.preventiveCost.toFixed(2),
      v.correctiveCost.toFixed(2),
      v.ordersCount,
      v.costPerKm !== null ? v.costPerKm.toFixed(4) : "Sem dados suficientes",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SIMAP_Custos_Frota_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação Concluída",
      description: "Arquivo CSV gerado com os custos detalhados por veículo.",
    });
  };

  // Exportação PDF
  const handleExportPDF = () => {
    if (!data) return;

    generateFinancialReportPdf({
      tenantName: session?.user?.tenantName || "Município de Jaborandi/SP",
      generatedBy: session?.user?.name || "Gestor SIMAP",
      data,
      filterLabels: {
        period:
          period === "30d"
            ? "Últimos 30 dias"
            : period === "90d"
            ? "Últimos 90 dias"
            : `Exercício ${new Date().getFullYear()}`,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        department: selectedDepartment !== "ALL" ? selectedDepartment : undefined,
      },
      insights: fleetInsights,
    });

    toast({
      title: "Relatório PDF Gerado",
      description: "O download do Relatório Executivo com Primeiros Insights foi iniciado.",
    });
  };

  // Congelar Snapshot
  const handleFreezeSnapshot = async () => {
    try {
      await createSnapshotMutation.mutateAsync({
        referenceYear: Number(freezeYear),
        referenceMonth: Number(freezeMonth),
        notes: freezeNotes || undefined,
      });

      toast({
        title: "Snapshot Congelado",
        description: `Mês ${String(freezeMonth).padStart(2, "0")}/${freezeYear} arquivado com sucesso para auditoria.`,
      });
      setFreezeModalOpen(false);
      setFreezeNotes("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao congelar snapshot";
      toast({
        title: "Erro ao Congelar",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // Atualizar Relatório Descritivo do Mês 4
  const handleSaveMonthlyUpdate = async () => {
    try {
      await updateMonthlyMutation.mutateAsync({
        referenceYear: 2026,
        referenceMonth: 4,
        advancesSummary,
        nextSteps,
        observations: observations || undefined,
      });

      toast({
        title: "Registro Salvo",
        description: "Avanços do Mês 4 e próximos passos registrados no histórico do projeto.",
      });
      setUpdateModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar atualização";
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // Filtragem de veículos na tabela
  const filteredVehicles = (data?.vehiclesSummary || []).filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.fleetCode.toLowerCase().includes(term) ||
      v.plate.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.department.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-72 rounded-2xl" />
          <Skeleton className="h-4 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-20 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalCost: 0,
    partsCost: 0,
    laborCost: 0,
    otherCost: 0,
    preventiveCost: 0,
    correctiveCost: 0,
    preventiveCostPercentage: 0,
    correctiveCostPercentage: 0,
    totalOrdersCount: 0,
    preventiveOrdersCount: 0,
    correctiveOrdersCount: 0,
    inspectionOrdersCount: 0,
    totalKmDriven: 0,
    costPerKm: null,
    availabilityPercentage: 100,
    totalDowntimeHours: 0,
    totalFleetHours: 0,
    preventiveCompliancePercentage: 100,
    dataQualityScore: 100,
    odometerCoveragePercentage: 100,
    costCompletenessPercentage: 100,
    pendingInconsistenciesCount: 0,
  };

  const deltas = data?.deltas || {
    totalCost: null,
    preventiveCost: null,
    correctiveCost: null,
    ordersCount: null,
  };

  const topCategoryItem = data?.categoriesDistribution && data.categoriesDistribution.length > 0
    ? {
        category: data.categoriesDistribution[0].category,
        cost: data.categoriesDistribution[0].totalCost,
        percentage: summary.totalCost > 0 ? Number(((data.categoriesDistribution[0].totalCost / summary.totalCost) * 100).toFixed(1)) : 0,
      }
    : undefined;

  const fleetInsights: FleetInsight[] = generateFleetFinancialInsights({
    totalCost: summary.totalCost,
    preventiveCost: summary.preventiveCost,
    correctiveCost: summary.correctiveCost,
    preventiveOrdersCount: summary.preventiveOrdersCount,
    correctiveOrdersCount: summary.correctiveOrdersCount,
    totalOrdersCount: summary.totalOrdersCount,
    costPerKm: summary.costPerKm,
    totalKmDriven: summary.totalKmDriven,
    availabilityPercentage: summary.availabilityPercentage,
    totalDowntimeHours: summary.totalDowntimeHours,
    dataQualityScore: summary.dataQualityScore,
    costCompletenessPercentage: summary.costCompletenessPercentage,
    odometerCoveragePercentage: summary.odometerCoveragePercentage,
    pendingInconsistenciesCount: summary.pendingInconsistenciesCount,
    topCategoryByCost: topCategoryItem,
  });

  return (
    <div className="space-y-8">
      {/* 1. Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Monitoramento & Visão Financeira
            </h1>
            <Badge variant="default" className="text-xs bg-emerald-600/90 hover:bg-emerald-600">
              Mês 4 — Ativo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Custos consolidados, proporção preventiva vs. corretiva, custo/km e disponibilidade da frota
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href={`/${params.tenantSlug}/financeiro/orcamento`}>
            <Button variant="outline" className="rounded-2xl gap-2 border-border/60 hover:bg-accent/60">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Orçamento Anual
            </Button>
          </Link>

          <Button
            variant="outline"
            className="rounded-2xl gap-2 border-border/60 hover:bg-accent/60"
            onClick={() => data && handleExportCSV(data)}
            disabled={!data}
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            CSV
          </Button>

          <Button
            className="rounded-2xl gap-2 shadow-md shadow-primary/20"
            onClick={handleExportPDF}
            disabled={!data}
          >
            <FileDown className="h-4 w-4" />
            Relatório Executivo PDF
          </Button>
        </div>
      </div>

      {/* 2. Barra de Filtros Multidimensionais */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Filter className="h-4 w-4 text-primary" />
                <span>Filtros:</span>
              </div>

              {/* Período */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs bg-background/50 border-border/50">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="year">Ano Atual ({new Date().getFullYear()})</SelectItem>
                </SelectContent>
              </Select>

              {/* Categoria */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs bg-background/50 border-border/50">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas Categorias</SelectItem>
                  <SelectItem value="ONIBUS">Ônibus</SelectItem>
                  <SelectItem value="AMBULANCIA">Ambulâncias</SelectItem>
                  <SelectItem value="CAMINHAO">Caminhões</SelectItem>
                  <SelectItem value="VAN">Vans</SelectItem>
                  <SelectItem value="CARRO">Carros Leves</SelectItem>
                  <SelectItem value="MAQUINA">Máquinas</SelectItem>
                </SelectContent>
              </Select>

              {/* Departamento */}
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 w-[170px] rounded-xl text-xs bg-background/50 border-border/50">
                  <SelectValue placeholder="Secretaria / Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Setores</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Saúde">Saúde</SelectItem>
                  <SelectItem value="Obras e Serviços Públicos">Obras e Serviços</SelectItem>
                  <SelectItem value="Meio Ambiente">Meio Ambiente</SelectItem>
                  <SelectItem value="Administração Geral">Administração Geral</SelectItem>
                </SelectContent>
              </Select>

              {/* Grupo Piloto */}
              <Button
                variant={pilotOnly ? "default" : "outline"}
                size="sm"
                className="h-9 rounded-xl text-xs gap-1.5"
                onClick={() => setPilotOnly(!pilotOnly)}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {pilotOnly ? "Apenas Piloto" : "Todos Veículos"}
              </Button>
            </div>

            {/* Ações Rápidas */}
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl text-xs gap-2"
                onClick={() => setFreezeModalOpen(true)}
              >
                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Congelar Snapshot do Mês
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Alerta de Cobertura e Qualidade dos Dados */}
      {summary.pendingInconsistenciesCount > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">Diagnóstico de Qualidade dos Registros Operacionais</h4>
              <p className="text-xs opacity-90">
                {summary.pendingInconsistenciesCount} pendências detectadas (ordens sem custo discriminado ou veículos sem odômetro recente). Score de cobertura: {summary.dataQualityScore}%.
              </p>
            </div>
          </div>
          <Link href={`/${params.tenantSlug}/inconsistencias`}>
            <Button variant="outline" size="sm" className="rounded-xl border-amber-500/30 hover:bg-amber-500/20 text-xs whitespace-nowrap">
              Ver Inconsistências
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Grid de KPIs Estratégicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Custo Total */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custo Total de Manutenção</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{formatBRL(summary.totalCost)}</div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              {deltas.totalCost !== null ? (
                <span className={`flex items-center font-semibold ${deltas.totalCost > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {deltas.totalCost > 0 ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                  {Math.abs(deltas.totalCost)}% vs. período anterior
                </span>
              ) : (
                <span className="text-muted-foreground">Período de referência</span>
              )}
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/30 flex justify-between text-[11px] text-muted-foreground">
              <span>Peças: {formatBRL(summary.partsCost)}</span>
              <span>Serviços: {formatBRL(summary.laborCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Proporção Preventiva vs Corretiva */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preventiva vs. Corretiva</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.preventiveCostPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">Preventiva ({formatBRL(summary.preventiveCost)})</span>
            </div>
            <div className="mt-2.5 h-2 w-full bg-muted/40 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${summary.preventiveCostPercentage}%` }}
                title={`Preventiva: ${summary.preventiveCostPercentage}%`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${summary.correctiveCostPercentage}%` }}
                title={`Corretiva: ${summary.correctiveCostPercentage}%`}
              />
            </div>
            <div className="mt-3 pt-1 flex justify-between text-[11px] text-muted-foreground font-medium">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {summary.preventiveOrdersCount} OS Preventivas ({summary.totalOrdersCount > 0 ? ((summary.preventiveOrdersCount / summary.totalOrdersCount) * 100).toFixed(0) : 0}%)
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {summary.correctiveOrdersCount} OS Corretivas ({summary.totalOrdersCount > 0 ? ((summary.correctiveOrdersCount / summary.totalOrdersCount) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Custo por Km Rodado (Regra: sem denominador inválido) */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custo Médio por Km Rodado</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Gauge className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {summary.costPerKm !== null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">
                    R$ {summary.costPerKm.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ km rodado</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseado em {summary.totalKmDriven.toLocaleString("pt-BR")} km apurados no período
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 py-1">
                    Sem dados suficientes
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Requer ao menos 2 leituras de odômetro por veículo no período
                </p>
              </>
            )}
            <div className="mt-3 pt-2.5 border-t border-border/30 flex justify-between text-[11px] text-muted-foreground">
              <span>{data?.activeVehiclesCount} veículos ativos</span>
              <span>{summary.odometerCoveragePercentage}% com leituras</span>
            </div>
          </CardContent>
        </Card>

        {/* Disponibilidade da Frota (Sem contagem duplicada) */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Disponibilidade da Frota</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${summary.availabilityPercentage >= 90 ? "text-foreground" : "text-amber-600 dark:text-amber-400"}`}>
                {summary.availabilityPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">operacional líquida</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalDowntimeHours} horas de parada registradas no período
            </p>
            <div className="mt-3 pt-2.5 border-t border-border/30 flex justify-between text-[11px] text-muted-foreground">
              <span>Meta: ≥ 90%</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Sem sobreposição de paradas</span>
            </div>
          </CardContent>
        </Card>

        {/* Cumprimento Preventivo */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cumprimento de Preventivas</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {summary.preventiveCompliancePercentage}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">no prazo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aderência às revisões programadas por tempo e km
            </p>
            <div className="mt-3 pt-2.5 border-t border-border/30 flex justify-between text-[11px] text-muted-foreground">
              <span>{summary.preventiveOrdersCount} programadas</span>
              <span>{summary.inspectionOrdersCount} vistorias realizadas</span>
            </div>
          </CardContent>
        </Card>

        {/* Índice de Qualidade de Dados */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confiabilidade dos Dados</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {summary.dataQualityScore}%
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Auditado</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completude de hodômetros e custos de peças/serviços
            </p>
            <div className="mt-3 pt-2.5 border-t border-border/30 flex justify-between text-[11px] text-muted-foreground">
              <span>Custos discriminados: {summary.costCompletenessPercentage}%</span>
              <span className="text-primary font-semibold">Transparência</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4.5 Seção de Primeiros Insights da Frota (Regras Transparentes) */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md overflow-hidden shadow-sm">
        <CardHeader className="p-6 pb-3 border-b border-border/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-extrabold tracking-tight">
                    Primeiros Insights & Diagnósticos da Frota
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Regras Transparentes
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Análise automatizada sem IA baseada em parâmetros operacionais auditáveis (Mês 4)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{fleetInsights.length} diagnósticos ativos</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fleetInsights.map((insight) => {
              const isPositive = insight.severity === "POSITIVE";
              const isWarning = insight.severity === "WARNING";
              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isPositive
                      ? "bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
                      : isWarning
                      ? "bg-amber-500/[0.04] border-amber-500/20 text-amber-950 dark:text-amber-100"
                      : "bg-blue-500/[0.04] border-blue-500/20 text-blue-950 dark:text-blue-100"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
                        {isPositive ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                        <span>{insight.title}</span>
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-mono shrink-0 ${
                          isPositive
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : isWarning
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {insight.metric}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                  {insight.recommendation && (
                    <div className="mt-3 pt-2.5 border-t border-border/20 text-[11px] text-muted-foreground/90 italic flex items-start gap-1.5">
                      <span className="font-semibold text-foreground not-italic">Ação recomendada:</span>
                      <span>{insight.recommendation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Gráficos Gerenciais (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Custos Mensal */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold">Evolução Mensal de Custos</CardTitle>
            <CardDescription className="text-xs">
              Comparativo de gastos entre Manutenção Preventiva e Manutenção Corretiva
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {data?.timeSeries && data.timeSeries.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-2xl border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md text-xs">
                              <p className="font-bold text-foreground mb-1.5">{label}</p>
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between gap-4 py-0.5">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-bold text-foreground">{formatBRL(entry.value as number)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                    <Bar dataKey="preventiveCost" name="Preventiva" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="correctiveCost" name="Corretiva" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Sem ordens de serviço suficientes no período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Categoria */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold">Gastos por Categoria de Veículo</CardTitle>
            <CardDescription className="text-xs">
              Concentração de custos entre Ônibus, Ambulâncias, Caminhões e Linha Leve
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {data?.categoriesDistribution && data.categoriesDistribution.length > 0 ? (
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoriesDistribution}
                      dataKey="totalCost"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {data.categoriesDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.category] || "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatBRL(value), "Custo Total"]}
                      contentStyle={{
                        borderRadius: "1rem",
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value) => <span className="text-xs text-foreground/80">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Wrench className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">Sem custos registrados por categoria no período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Abas Operacionais: Tabela Detalhada, Snapshots e Relatório Mensal */}
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="vehicles" className="gap-2">
            Custos por Veículo ({filteredVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="gap-2">
            Snapshots Mensais Arquivados ({snapshots?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-2">
            Avanços do Mês 4 & Governança
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Tabela por Veículo */}
        <TabsContent value="vehicles">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Detalhamento Financeiro da Frota</CardTitle>
                  <CardDescription className="text-xs">
                    Consolidado de quilômetros rodados, gastos preventivos/corretivos e custo por quilômetro
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar placa, código ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 rounded-xl text-xs bg-background/50 border-border/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/30 border-y border-border/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Veículo</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Departamento</th>
                      <th className="py-3 px-4 text-right">Km Rodado</th>
                      <th className="py-3 px-4 text-right">Custo Preventivo</th>
                      <th className="py-3 px-4 text-right">Custo Corretivo</th>
                      <th className="py-3 px-4 text-right">Custo Total</th>
                      <th className="py-3 px-4 text-right">Custo / Km</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <span>{v.fleetCode}</span>
                              <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 border-border/60">
                                {v.plate}
                              </Badge>
                              {v.isPilot && (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                  Piloto
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-normal truncate max-w-[200px]">
                              {v.model}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium">{v.category}</td>
                          <td className="py-3.5 px-4 text-muted-foreground truncate max-w-[150px]">{v.department}</td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            {v.kmDriven > 0 ? `${v.kmDriven.toLocaleString("pt-BR")} km` : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                            {v.preventiveCost > 0 ? formatBRL(v.preventiveCost) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400 font-medium">
                            {v.correctiveCost > 0 ? formatBRL(v.correctiveCost) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-foreground">
                            {formatBRL(v.totalCost)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {v.costPerKm !== null ? (
                              <span className="font-bold text-foreground font-mono">
                                R$ {v.costPerKm.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px] italic">Sem dados</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link href={`/${params.tenantSlug}/veiculos/${v.id}/timeline`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] rounded-lg">
                                Linha do Tempo
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground">
                          Nenhum veículo encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Snapshots Mensais */}
        <TabsContent value="snapshots">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Snapshots Mensais Congelados</CardTitle>
                  <CardDescription className="text-xs">
                    Fechamentos mensais arquivados e imutáveis para prestação de contas aos órgãos municipais
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    className="rounded-xl text-xs gap-2"
                    onClick={() => setFreezeModalOpen(true)}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Novo Congelamento
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {loadingSnapshots ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 rounded-2xl" />
                  <Skeleton className="h-16 rounded-2xl" />
                </div>
              ) : snapshots && snapshots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {snapshots.map((snap) => (
                    <Card key={snap.id} className="rounded-2xl border-border/40 bg-card/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
                            {String(snap.referenceMonth).padStart(2, "0")}/{snap.referenceYear}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                            Congelado
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{formatUTCDate(snap.createdAt)}</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Total:</span>
                          <span className="font-bold text-foreground">{formatBRL(Number(snap.totalCost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preventiva:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatBRL(Number(snap.preventiveCost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Corretiva:</span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium">{formatBRL(Number(snap.correctiveCost))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Disponibilidade:</span>
                          <span className="font-bold text-foreground">{Number(snap.availabilityPercentage)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo / Km:</span>
                          <span className="font-mono">
                            {snap.costPerKm ? `R$ ${Number(snap.costPerKm).toFixed(2)}` : "Sem dados"}
                          </span>
                        </div>
                      </div>

                      {snap.notes && (
                        <p className="text-[11px] text-muted-foreground italic border-t border-border/20 pt-2 line-clamp-2">
                          &ldquo;{snap.notes}&rdquo;
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Lock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Nenhum snapshot mensal arquivado ainda.</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Conclua o mês e utilize o botão &ldquo;Novo Congelamento&rdquo; para salvar o histórico imutável.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Relatório Descritivo do Mês 4 */}
        <TabsContent value="report">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Registro de Governança — Mês 4 (Monitoramento & Ajustes)</CardTitle>
                  <CardDescription className="text-xs">
                    Documentação institucional de avanços, lições aprendidas e próximos passos do projeto SIMAP
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs gap-2"
                    onClick={() => {
                      const upd: MonthlyProjectUpdateItem | null = Array.isArray(monthlyUpdate)
                        ? (monthlyUpdate[0] ?? null)
                        : (monthlyUpdate ?? null);
                      if (upd) {
                        setAdvancesSummary(upd.advancesSummary);
                        setNextSteps(upd.nextSteps);
                        setObservations(upd.observations || "");
                      }
                      setUpdateModalOpen(true);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar Registro
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-3 space-y-6">
              {(() => {
                const upd: MonthlyProjectUpdateItem | null = Array.isArray(monthlyUpdate)
                  ? (monthlyUpdate[0] ?? null)
                  : (monthlyUpdate ?? null);
                return (
                  <div className="space-y-5 text-xs text-foreground">
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-2">
                      <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Avanços e Resultados Alcançados no Mês
                      </h4>
                      <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {upd?.advancesSummary ||
                          "Implantação do monitoramento financeiro contínuo da frota municipal. Início da aferição sistemática do custo por quilômetro rodado e controle rigoroso de ordens de serviço preventivas e corretivas."}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-2">
                      <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Próximos Passos Prioritários (Mês 5 — Relatório Executivo)
                      </h4>
                      <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {upd?.nextSteps ||
                          "Consolidação do 1º Relatório Executivo de desempenho da frota com comparativo formal antes/depois da implantação da manutenção preventiva. Expansão gradual do grupo piloto para toda a linha pesada."}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-2">
                      <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Observações e Recomendações Técnicas
                      </h4>
                      <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {upd?.observations ||
                          "Recomenda-se manter a rotina diária de lançamento de odômetros nos veículos escolares e de saúde para garantir 100% de precisão nos indicadores de custo/km e prevenção de indisponibilidade."}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Congelar Snapshot */}
      <Dialog open={freezeModalOpen} onOpenChange={setFreezeModalOpen}>
        <DialogContent className="rounded-3xl border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Congelar Snapshot de Indicadores</DialogTitle>
            <DialogDescription className="text-xs">
              Gera um fechamento mensal histórico com as métricas atuais. Uma vez congelado, os dados do período não serão alterados por lançamentos futuros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Mês de Referência</Label>
                <Select
                  value={String(freezeMonth)}
                  onValueChange={(val) => setFreezeMonth(Number(val))}
                >
                  <SelectTrigger className="mt-1 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {String(i + 1).padStart(2, "0")} — {new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(2026, i, 1))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Ano de Exercício</Label>
                <Input
                  type="number"
                  value={freezeYear}
                  onChange={(e) => setFreezeYear(Number(e.target.value))}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas do Fechamento (Opcional)</Label>
              <Textarea
                placeholder="Ex: Fechamento contábil e operacional regular do mês..."
                value={freezeNotes}
                onChange={(e) => setFreezeNotes(e.target.value)}
                className="mt-1 rounded-xl text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setFreezeModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="rounded-xl text-xs gap-2"
              onClick={handleFreezeSnapshot}
              disabled={createSnapshotMutation.isPending}
            >
              <Lock className="h-3.5 w-3.5" />
              Confirmar Congelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Atualização do Mês */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="rounded-3xl border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Registro de Governança — Mês 4</DialogTitle>
            <DialogDescription className="text-xs">
              Atualize o resumo de avanços e os próximos passos para o acompanhamento do projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div>
              <Label className="text-xs">Avanços do Mês</Label>
              <Textarea
                rows={3}
                placeholder="Descreva as principais conquistas do mês..."
                value={advancesSummary}
                onChange={(e) => setAdvancesSummary(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Próximos Passos</Label>
              <Textarea
                rows={3}
                placeholder="Principais prioridades para o próximo mês..."
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">Observações Gerais</Label>
              <Textarea
                rows={2}
                placeholder="Orientações e apontamentos adicionais..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setUpdateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={handleSaveMonthlyUpdate}
              disabled={updateMonthlyMutation.isPending}
            >
              Salvar Atualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
