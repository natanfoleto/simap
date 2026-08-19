"use client";

import React, { useState, useEffect } from "react";
import { useProject, useUpdateProjectSettings } from "@/hooks/use-project";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/formatters";
import {
  FolderGit2,
  DollarSign,
  TrendingDown,
  Save,
  Loader2,
  Building2,
  Truck,
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
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalVehicles: 97,
    activeVehicles: 97,
  };

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
          Parâmetros da Frota & Metas Financeiras
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calibração da linha de base orçamentária e metas financeiras de redução de custos de manutenção
        </p>
      </div>

      {/* Informações Gerais da Frota */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Parâmetros Operacionais da Frota Municipal</CardTitle>
              <CardDescription className="text-xs">
                Visão de cadastro institucional e dimensionamento da frota pública
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" /> Município:
              </span>
              <p className="text-sm font-bold text-foreground">Município de Jaborandi/SP</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-emerald-600" /> Frota Total:
              </span>
              <p className="text-sm font-bold text-foreground">{stats.totalVehicles} Veículos Registrados</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/20 space-y-1">
              <span className="font-semibold text-muted-foreground">Sistema:</span>
              <p className="text-sm font-bold text-foreground">SIMAP — Manutenção Preventiva</p>
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
                <CardTitle className="text-base font-bold">Linha de Base Financeira & Meta de Economia</CardTitle>
                <CardDescription className="text-xs">
                  Configuração de referência utilizada nos relatórios e comparativos financeiros
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
                  Meta de Economia (%)
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
    </div>
  );
}
