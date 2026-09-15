"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useBudget, useUpdateBudget } from "@/hooks/use-financial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, formatPercentage } from "@/lib/formatters";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Wrench,
  AlertCircle,
  ShieldCheck,
  Edit,
  ArrowLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function AnnualBudgetPage({ params }: { params: { tenantSlug: string } }) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data, isLoading } = useBudget(selectedYear);
  const updateBudgetMutation = useUpdateBudget();

  // Form states
  const [baselineAmount, setBaselineAmount] = useState<number>(285000);
  const [targetReductionPercentage, setTargetReductionPercentage] = useState<number>(20);
  const [plannedPreventive, setPlannedPreventive] = useState<number>(148200);
  const [plannedCorrective, setPlannedCorrective] = useState<number>(57000);
  const [plannedContingency, setPlannedContingency] = useState<number>(22800);
  const [notes, setNotes] = useState<string>("");

  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "GESTOR";

  const handleOpenEdit = () => {
    if (data?.budget) {
      setBaselineAmount(data.budget.baselineAmount);
      setTargetReductionPercentage(data.budget.targetReductionPercentage);
      setPlannedPreventive(data.budget.plannedPreventive);
      setPlannedCorrective(data.budget.plannedCorrective);
      setPlannedContingency(data.budget.plannedContingency);
      setNotes(data.budget.notes || "");
    }
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = async () => {
    try {
      await updateBudgetMutation.mutateAsync({
        year: selectedYear,
        baselineAmount,
        targetReductionPercentage,
        plannedPreventive,
        plannedCorrective,
        plannedContingency,
        notes: notes || undefined,
      });

      toast({
        title: "Orçamento Atualizado",
        description: `Dotações orçamentárias de ${selectedYear} gravadas com sucesso.`,
      });
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar orçamento";
      toast({
        title: "Erro ao Salvar",
        description: msg,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  const budget = data?.budget || {
    year: selectedYear,
    baselineAmount: 285000,
    targetReductionPercentage: 20,
    targetSavings: 57000,
    targetSpendingCap: 228000,
    plannedPreventive: 148200,
    plannedCorrective: 57000,
    plannedContingency: 22800,
    totalPlanned: 228000,
    notes: null,
  };

  const execution = data?.execution || {
    realizedTotal: 0,
    realizedPreventive: 0,
    realizedCorrective: 0,
    preventiveSharePercentage: 0,
    correctiveSharePercentage: 0,
    remainingBalance: 0,
    executionPercentage: 0,
    actualSavingsVsBaseline: 0,
  };

  const chartData = [
    {
      category: "Preventiva",
      Planejado: budget.plannedPreventive,
      Realizado: execution.realizedPreventive,
    },
    {
      category: "Corretiva",
      Planejado: budget.plannedCorrective,
      Realizado: execution.realizedCorrective,
    },
    {
      category: "Total",
      Planejado: budget.totalPlanned,
      Realizado: execution.realizedTotal,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${params.tenantSlug}/financeiro`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Monitoramento
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Orçamento Anual de Manutenção
            </h1>
            <Badge variant="outline" className="text-xs font-bold border-primary/40 text-primary">
              Exercício {selectedYear}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Planejamento orçamentário, linha de base histórica e acompanhamento da meta de 20% de redução
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="h-10 w-[140px] rounded-2xl text-xs bg-background/50 border-border/50">
              <Calendar className="h-4 w-4 mr-1 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">Ano 2025</SelectItem>
              <SelectItem value="2026">Ano 2026</SelectItem>
              <SelectItem value="2027">Ano 2027</SelectItem>
            </SelectContent>
          </Select>

          {canEdit && (
            <Button
              className="rounded-2xl gap-2 shadow-md shadow-primary/20"
              onClick={handleOpenEdit}
            >
              <Edit className="h-4 w-4" />
              Ajustar Dotações
            </Button>
          )}
        </div>
      </div>

      {/* 2. Grid de Cards Orçamentários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Linha de Base */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Linha de Base</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{formatBRL(budget.baselineAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gasto anual histórico de referência municipal
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
                {budget.targetReductionPercentage}%
              </span>
              <span className="text-xs text-emerald-600/80 font-bold">
                ({formatBRL(budget.targetSavings)})
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Teto Meta: {formatBRL(budget.targetSpendingCap)}
            </p>
          </CardContent>
        </Card>

        {/* Realizado no Exercício */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gasto Realizado</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{formatBRL(execution.realizedTotal)}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                <span>{execution.executionPercentage}% executado</span>
                <span>Teto: {formatBRL(budget.totalPlanned)}</span>
              </div>
              <Progress value={Math.min(100, execution.executionPercentage)} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Saldo Remanescente */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Saldo Orçamentário</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <PiggyBank className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{formatBRL(execution.remainingBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Economia apurada vs. base: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(execution.actualSavingsVsBaseline)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Detalhamento das Dotações (Planejado vs Realizado) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Preventiva */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">Dotação Preventiva</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Prioridade
              </Badge>
            </div>
            <CardDescription className="text-xs">Revisões periódicas, trocas de óleo, filtros e freios</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Planejado:</span>
              <span className="font-bold text-foreground">{formatBRL(budget.plannedPreventive)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Realizado:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(execution.realizedPreventive)}</span>
            </div>
            <Progress
              value={budget.plannedPreventive > 0 ? (execution.realizedPreventive / budget.plannedPreventive) * 100 : 0}
              className="h-1.5"
            />
          </CardContent>
        </Card>

        {/* Corretiva */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">Dotação Corretiva</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                A Controlar
              </Badge>
            </div>
            <CardDescription className="text-xs">Reparos de emergência, quebras mecânicas e sinistros</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Planejado:</span>
              <span className="font-bold text-foreground">{formatBRL(budget.plannedCorrective)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Realizado:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatBRL(execution.realizedCorrective)}</span>
            </div>
            <Progress
              value={budget.plannedCorrective > 0 ? (execution.realizedCorrective / budget.plannedCorrective) * 100 : 0}
              className="h-1.5"
            />
          </CardContent>
        </Card>

        {/* Contingência */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">Reserva de Contingência</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                Reserva
              </Badge>
            </div>
            <CardDescription className="text-xs">Margem para imprevistos de tráfego intenso ou safra</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Planejado:</span>
              <span className="font-bold text-foreground">{formatBRL(budget.plannedContingency)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Disponível:</span>
              <span className="font-bold text-foreground">{formatBRL(budget.plannedContingency)}</span>
            </div>
            <Progress value={0} className="h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* 4. Gráfico Comparativo Planejado vs Realizado */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-base font-bold">Comparativo Gráfico — Planejado vs. Realizado</CardTitle>
          <CardDescription className="text-xs">
            Monitoramento visual do consumo orçamentário por tipo de intervenção
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis dataKey="category" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => [formatBRL(val)]}
                  contentStyle={{
                    borderRadius: "1rem",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                <Bar dataKey="Planejado" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Realizado" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição de Orçamento */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-3xl border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Ajustar Orçamento de {selectedYear}</DialogTitle>
            <DialogDescription className="text-xs">
              Atualize as dotações planejadas e a meta de economia para o exercício da frota municipal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Linha de Base Histórica (R$)</Label>
                <Input
                  type="number"
                  value={baselineAmount}
                  onChange={(e) => setBaselineAmount(Number(e.target.value))}
                  className="mt-1 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Meta de Redução (%)</Label>
                <Input
                  type="number"
                  value={targetReductionPercentage}
                  onChange={(e) => setTargetReductionPercentage(Number(e.target.value))}
                  className="mt-1 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Preventiva (R$)</Label>
                <Input
                  type="number"
                  value={plannedPreventive}
                  onChange={(e) => setPlannedPreventive(Number(e.target.value))}
                  className="mt-1 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Corretiva (R$)</Label>
                <Input
                  type="number"
                  value={plannedCorrective}
                  onChange={(e) => setPlannedCorrective(Number(e.target.value))}
                  className="mt-1 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Contingência (R$)</Label>
                <Input
                  type="number"
                  value={plannedContingency}
                  onChange={(e) => setPlannedContingency(Number(e.target.value))}
                  className="mt-1 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teto Orçamentário Planejado:</span>
                <span className="font-bold text-foreground font-mono">
                  {formatBRL(plannedPreventive + plannedCorrective + plannedContingency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Economia Projetada:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatBRL((baselineAmount * targetReductionPercentage) / 100)}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Observações do Orçamento</Label>
              <Textarea
                rows={2}
                placeholder="Ex: Justificativa dos percentuais de alocação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={handleSaveBudget}
              disabled={updateBudgetMutation.isPending}
            >
              Salvar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
