"use client";

import React, { useState, useEffect } from "react";
import { useProject, useUpdateProjectSettings } from "@/hooks/use-project";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, formatPercentage, formatUTCDate } from "@/lib/formatters";
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingDown,
  Save,
  Loader2,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export default function ProjectSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useProject();
  const updateSettings = useUpdateProjectSettings();

  const [formData, setFormData] = useState({
    baselineYear: 2025,
    baselineAmount: 285000,
    targetReductionPercentage: 20,
  });

  useEffect(() => {
    if (data?.settings) {
      setFormData({
        baselineYear: data.settings.baselineYear,
        baselineAmount: data.settings.baselineAmount,
        targetReductionPercentage: data.settings.targetReductionPercentage,
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const project = data?.project || {
    title: "Implementação de Manutenção Preventiva nos veículos públicos do município",
    systemName: "SIMAP",
    durationMonths: 8,
    theme: "Transporte Público",
  };

  const milestones = data?.milestones || [];
  const calculatedSavings = (formData.baselineAmount * formData.targetReductionPercentage) / 100;

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();

    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "Configurações atualizadas",
        description: "Linha de base e meta de redução salvas com sucesso.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Gestão do Projeto & Marcos Oficiais
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhamento dos 8 meses do programa Pro Inova e calibração de premissas orçamentárias
        </p>
      </div>

      {/* Informações Gerais do Projeto */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{project.title}</CardTitle>
              <CardDescription className="text-xs">
                Programa Pro Inova • {project.theme} • Duração oficial: {project.durationMonths} meses
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Sistema:</span>
              <p className="text-sm font-bold text-foreground">{project.systemName}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Município Piloto:</span>
              <p className="text-sm font-bold text-foreground">Jaborandi/SP (97 Veículos)</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Status Atual:</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Meses 1 e 2 Validados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Linha de Base e Meta */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <form onSubmit={handleSaveSettings}>
          <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Linha de Base Financeira & Meta de Redução</CardTitle>
                <CardDescription className="text-xs">
                  Configuração auditável utilizada como referência para os cálculos de economia
                </CardDescription>
              </div>
            </div>
            <Badge variant="warning" className="text-xs">
              Configurável
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="baselineYear" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ano da Linha de Base
                </Label>
                <Input
                  id="baselineYear"
                  type="number"
                  min={2020}
                  max={2035}
                  value={formData.baselineYear}
                  onChange={(e) => setFormData({ ...formData, baselineYear: parseInt(e.target.value, 10) || 2025 })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baselineAmount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor Histórico Anual (R$)
                </Label>
                <Input
                  id="baselineAmount"
                  type="number"
                  step="0.01"
                  min={0}
                  value={formData.baselineAmount}
                  onChange={(e) => setFormData({ ...formData, baselineAmount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetReductionPercentage" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meta de Redução (%)
                </Label>
                <Input
                  id="targetReductionPercentage"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={formData.targetReductionPercentage}
                  onChange={(e) => setFormData({ ...formData, targetReductionPercentage: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            {/* Resultado do Cálculo Dinâmico */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Meta Calculada de Economia Anual
                  </span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {formData.targetReductionPercentage}% sobre {formatBRL(formData.baselineAmount)}
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatBRL(calculatedSavings)}
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/30 flex justify-end">
            <Button
              type="submit"
              disabled={updateSettings.isPending}
              className="rounded-xl gap-2 shadow-sm"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Tabela dos 8 Marcos Institucionais */}
      <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Quadro Oficial de Marcos do Pro Inova (M1 a M8)
          </CardTitle>
          <CardDescription className="text-xs">
            Registro de entregáveis e comprovações de cada mês do programa
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {milestones.map((m: {
              id: string;
              monthNumber: number;
              title: string;
              deliverable: string;
              evidence: string;
              status: string;
              completionPercentage: number;
              validatedAt?: string;
            }) => {
              const isValidated = m.status === "VALIDADO";
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    isValidated
                      ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "border-border/40 bg-card/40 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                      isValidated ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      M{m.monthNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{m.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.deliverable}</p>
                      <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-1">
                        <strong>Evidência:</strong> {m.evidence}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {isValidated ? (
                      <div className="text-right">
                        <Badge variant="success" className="gap-1 py-1">
                          <CheckCircle2 className="h-3 w-3" />
                          100% VALIDADO
                        </Badge>
                        {m.validatedAt && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                            Validado em {formatUTCDate(m.validatedAt)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="neutral" className="gap-1 py-1">
                        <Clock className="h-3 w-3" />
                        0% PENDENTE
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
