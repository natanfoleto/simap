"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePilotGroups, useCreatePilotGroup } from "@/hooks/use-pilot-groups";
import { useVehicles } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatOdometer, formatUTCDate } from "@/lib/formatters";
import {
  ShieldAlert,
  Plus,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  Loader2,
} from "lucide-react";

export default function PilotGroupPage({ params }: { params: { tenantSlug: string } }) {
  const { toast } = useToast();
  const { data: groups, isLoading } = usePilotGroups();
  const { data: vehiclesData } = useVehicles({ limit: 100, tenantSlug: params.tenantSlug });
  const createMutation = useCreatePilotGroup();

  const vehicles = vehiclesData?.items || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("Grupo Prioritário — Transporte Escolar & Saúde");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function toggleVehicle(id: string) {
    if (selectedVehicleIds.includes(id)) {
      setSelectedVehicleIds(selectedVehicleIds.filter((vId) => vId !== id));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, id]);
    }
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();

    if (selectedVehicleIds.length === 0) {
      toast({
        title: "Selecione veículos",
        description: "Adicione ao menos um veículo ao grupo piloto.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        startDate,
        vehicleIds: selectedVehicleIds,
        notes,
      });

      setIsModalOpen(false);
      setSelectedVehicleIds([]);
      toast({
        title: "Grupo Piloto Criado!",
        description: `${selectedVehicleIds.length} veículos adicionados à operação controlada.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao criar",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Grupo Piloto — Monitoramento Prioritário
            </h1>
            <Badge variant="default" className="text-xs">
              Ativo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento intensivo de veículos estratégicos com checklists diários e preventivas prioritárias
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Grupo Piloto
        </Button>
      </div>

      {/* Lista de Grupos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : !groups || groups.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border-border/40 bg-card/30 space-y-3">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold">Nenhum grupo piloto cadastrado</h3>
          <p className="text-xs text-muted-foreground">
            Crie um grupo piloto para acompanhar de perto os veículos prioritários da frota.
          </p>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-xl mt-2 text-xs">
            Criar Grupo Piloto
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((grp: {
            id: string;
            name: string;
            status: string;
            startDate: string;
            notes?: string;
            vehicles: Array<{
              vehicle: {
                id: string;
                fleetCode: string;
                plate: string;
                model: string;
                category: string;
                status: string;
                currentOdometer: number;
              };
            }>;
          }) => (
            <Card key={grp.id} className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-sm">
              <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{grp.name}</CardTitle>
                    <Badge variant="success" className="text-[10px]">
                      {grp.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Iniciado em {formatUTCDate(grp.startDate)} • Total de {grp.vehicles?.length || 0} veículos participantes
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {grp.vehicles?.map((link) => (
                    <div
                      key={link.vehicle.id}
                      className="p-3.5 rounded-2xl bg-card/60 border border-border/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">
                          {link.vehicle.fleetCode}
                        </span>
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {link.vehicle.plate}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{link.vehicle.model}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/20">
                        <span>{formatOdometer(link.vehicle.currentOdometer)}</span>
                        <Badge variant="neutral" className="text-[9px]">
                          {link.vehicle.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação de Grupo Piloto */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleCreateGroup}>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo Piloto</DialogTitle>
              <DialogDescription>
                Defina o nome do grupo e selecione os veículos participantes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="groupName">Nome do Grupo *</Label>
                  <Input
                    id="groupName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">
                    Selecione os Veículos do Piloto ({selectedVehicleIds.length} selecionados)
                  </Label>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-2xl border border-border/30 bg-muted/20">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleIds.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleVehicle(v.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                          isSelected
                            ? "bg-primary/10 border-primary font-bold"
                            : "bg-card/40 border-border/30 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded flex items-center justify-center border ${isSelected ? "bg-primary text-white border-primary" : "border-border"}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                          <span>{v.fleetCode} — {v.model} ({v.plate})</span>
                        </div>
                        <Badge variant="neutral" className="text-[10px]">{v.category}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || selectedVehicleIds.length === 0}
                className="rounded-xl gap-2 shadow-sm"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar Grupo ({selectedVehicleIds.length} veículos)
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
