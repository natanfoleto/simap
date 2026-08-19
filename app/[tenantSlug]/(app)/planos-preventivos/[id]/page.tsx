"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePreventivePlan, useAssignPlanToVehicles } from "@/hooks/use-preventive-plans";
import { useVehicles } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  CalendarCheck,
  ArrowLeft,
  Truck,
  Plus,
  Layers,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  Clock,
  Gauge,
} from "lucide-react";

export default function PreventivePlanDetailPage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const { toast } = useToast();
  const { data: plan, isLoading } = usePreventivePlan(params.id);
  const assignMutation = useAssignPlanToVehicles(params.id);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

  // Buscar veículos da mesma categoria para permitir vinculação
  const { data: categoryVehiclesData } = useVehicles({
    category: plan?.category,
    limit: 100,
    tenantSlug: params.tenantSlug,
  });

  const categoryVehicles = categoryVehiclesData?.items || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Plano não encontrado</h2>
        <Link href={`/${params.tenantSlug}/planos-preventivos`}>
          <Button variant="outline" className="rounded-xl">Voltar aos planos</Button>
        </Link>
      </div>
    );
  }

  function openAssignModal() {
    // Pré-seleciona os veículos já vinculados
    const currentAssigned = plan.assignedVehicles?.map((av: { vehicle: { id: string } }) => av.vehicle.id) || [];
    setSelectedVehicleIds(currentAssigned);
    setIsAssignModalOpen(true);
  }

  function toggleVehicleSelection(id: string) {
    if (selectedVehicleIds.includes(id)) {
      setSelectedVehicleIds(selectedVehicleIds.filter((vId) => vId !== id));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, id]);
    }
  }

  async function handleConfirmAssignment() {
    try {
      await assignMutation.mutateAsync(selectedVehicleIds);
      setIsAssignModalOpen(false);
      toast({
        title: "Vínculos atualizados",
        description: `O plano agora está vinculado a ${selectedVehicleIds.length} veículo(s).`,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao vincular",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.tenantSlug}/planos-preventivos`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {plan.name}
              </h1>
              <Badge variant="default">{plan.category}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Versão {plan.version} • {plan.items?.length || 0} itens configurados
            </p>
          </div>
        </div>

        <Button onClick={openAssignModal} className="rounded-2xl gap-2 shadow-sm">
          <LinkIcon className="h-4 w-4" />
          Vincular a Veículos
        </Button>
      </div>

      {/* Card dos Itens do Plano */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Matriz de Procedimentos e Periodicidade
          </CardTitle>
          <CardDescription className="text-xs">
            A regra de manutenção preventiva dispara pelo primeiro critério atingido (km ou tempo)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead>Intervalo em km</TableHead>
                <TableHead>Intervalo em Dias</TableHead>
                <TableHead>Antecedência de Alerta</TableHead>
                <TableHead>Prioridade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.items?.map((item: {
                id: string;
                name: string;
                description?: string;
                intervalKm?: number;
                intervalDays?: number;
                toleranceKm?: number;
                toleranceDays?: number;
                priority: string;
              }) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">{item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {item.intervalKm ? `${item.intervalKm.toLocaleString("pt-BR")} km` : "—"}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {item.intervalDays ? `${item.intervalDays} dias` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.toleranceKm ? `${item.toleranceKm} km` : ""}
                    {item.toleranceKm && item.toleranceDays ? " / " : ""}
                    {item.toleranceDays ? `${item.toleranceDays} dias` : ""}
                    {!item.toleranceKm && !item.toleranceDays ? "Padrão" : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.priority === "CRITICA" ? "destructive" : "neutral"} className="text-[10px]">
                      {item.priority}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Veículos Vinculados */}
      <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Veículos Vinculados a este Plano</CardTitle>
              <CardDescription className="text-xs">
                Total de {plan.assignedVehicles?.length || 0} veículos com este plano ativo
              </CardDescription>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={openAssignModal} className="rounded-xl gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Gerenciar Vínculos
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {!plan.assignedVehicles || plan.assignedVehicles.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <Truck className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                Nenhum veículo vinculado a este plano até o momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {plan.assignedVehicles.map((av: {
                vehicle: {
                  id: string;
                  fleetCode: string;
                  plate: string;
                  model: string;
                  category: string;
                  status: string;
                  currentOdometer: number;
                };
              }) => (
                <div key={av.vehicle.id} className="p-3.5 rounded-2xl border border-border/30 bg-card/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{av.vehicle.fleetCode}</span>
                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{av.vehicle.plate}</span>
                  </div>
                  <p className="text-xs text-foreground/80 truncate">{av.vehicle.model}</p>
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/20">
                    <span>{av.vehicle.currentOdometer.toLocaleString("pt-BR")} km</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{av.vehicle.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Vinculação de Veículos */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular Plano a Veículos</DialogTitle>
            <DialogDescription>
              Selecione os veículos da categoria <strong>{plan.category}</strong> que devem adotar este plano preventivo.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto space-y-2 py-2">
            {categoryVehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                Nenhum veículo cadastrado na categoria {plan.category}.
              </p>
            ) : (
              categoryVehicles.map((v: {
                id: string;
                fleetCode: string;
                plate: string;
                model: string;
                currentOdometer: number;
              }) => {
                const isSelected = selectedVehicleIds.includes(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => toggleVehicleSelection(v.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${isSelected ? "bg-primary border-primary text-white" : "border-border"}`}>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span>{v.fleetCode}</span>
                          <span className="font-mono text-muted-foreground text-[11px]">{v.plate}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{v.model}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {v.currentOdometer.toLocaleString("pt-BR")} km
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAssignment}
              disabled={assignMutation.isPending}
              className="rounded-xl gap-2 shadow-sm"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                `Confirmar (${selectedVehicleIds.length} selecionados)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
