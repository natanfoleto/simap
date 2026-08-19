"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVehicles } from "@/hooks/use-vehicles";
import { useChecklistTemplates, useExecuteInspection } from "@/hooks/use-checklists";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatOdometer } from "@/lib/formatters";
import {
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Loader2,
  Truck,
  Wrench,
  Gauge,
} from "lucide-react";

type AnswerStatus = "OK" | "ALERTA" | "CRITICO" | "NAO_SE_APLICA";

interface ItemAnswerState {
  templateItemId: string;
  title: string;
  status: AnswerStatus;
  notes: string;
}

export default function ExecuteChecklistPage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [odometer, setOdometer] = useState<string>("");
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [answers, setAnswers] = useState<ItemAnswerState[]>([]);

  // Modal pós-submissão para item crítico
  const [criticalModalOpen, setCriticalModalOpen] = useState(false);
  const [createdInspectionId, setCreatedInspectionId] = useState<string | null>(null);

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useVehicles({
    limit: 100,
    tenantSlug: params.tenantSlug,
  });

  const vehicles = vehiclesData?.items || [];
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Busca template da categoria do veículo
  const { data: templates, isLoading: isLoadingTemplates } = useChecklistTemplates(
    selectedVehicle?.category
  );

  const template = templates?.[0]; // Pega o primeiro template ativo da categoria

  useEffect(() => {
    if (selectedVehicle) {
      setOdometer(String(selectedVehicle.currentOdometer));
    }
  }, [selectedVehicle]);

  useEffect(() => {
    if (template && template.items) {
      setAnswers(
        template.items.map((it: { id: string; title: string }) => ({
          templateItemId: it.id,
          title: it.title,
          status: "OK" as AnswerStatus,
          notes: "",
        }))
      );
    } else {
      setAnswers([]);
    }
  }, [template]);

  const executeMutation = useExecuteInspection();

  function updateItemStatus(itemId: string, status: AnswerStatus) {
    setAnswers((prev) =>
      prev.map((a) => (a.templateItemId === itemId ? { ...a, status } : a))
    );
  }

  function updateItemNotes(itemId: string, notes: string) {
    setAnswers((prev) =>
      prev.map((a) => (a.templateItemId === itemId ? { ...a, notes } : a))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedVehicleId) {
      toast({
        title: "Selecione o veículo",
        description: "É obrigatório selecionar o veículo da inspeção.",
        variant: "destructive",
      });
      return;
    }

    if (!template) {
      toast({
        title: "Template não encontrado",
        description: `Não há template de checklist cadastrado para a categoria ${selectedVehicle?.category}.`,
        variant: "destructive",
      });
      return;
    }

    const numOdometer = parseInt(odometer, 10);
    if (isNaN(numOdometer) || numOdometer < 0) {
      toast({
        title: "Hodômetro inválido",
        description: "Informe uma quilometragem válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await executeMutation.mutateAsync({
        vehicleId: selectedVehicleId,
        templateId: template.id,
        odometer: numOdometer,
        notes: generalNotes || null,
        answers: answers.map((a) => ({
          templateItemId: a.templateItemId,
          status: a.status,
          notes: a.notes || null,
        })),
      });

      const hasCritical = answers.some((a) => a.status === "CRITICO");

      if (hasCritical) {
        setCreatedInspectionId(result.id);
        setCriticalModalOpen(true);
      } else {
        toast({
          title: "Checklist concluído!",
          description: "A inspeção foi registrada com sucesso.",
        });
        router.push(`/${params.tenantSlug}/checklists`);
      }
    } catch (err: unknown) {
      toast({
        title: "Erro ao registrar checklist",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4">
        <Link href={`/${params.tenantSlug}/checklists`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Executar Checklist Diário
          </h1>
          <p className="text-xs text-muted-foreground">
            Inspeção rápida touch-friendly antes da saída do veículo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação do Veículo e Hodômetro */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-4 border-b border-border/30">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              1. Dados da Viatura / Veículo
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Veículo *
                </Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o veículo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.fleetCode} — {v.model} ({v.plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="odometerInput" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" /> Hodômetro Atual (km) *
                </Label>
                <Input
                  id="odometerInput"
                  type="number"
                  placeholder="ex: 125400"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  required
                />
              </div>
            </div>

            {selectedVehicle && template && (
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">
                  Template Aplicado: {template.name}
                </span>
                <Badge variant="default" className="text-[10px]">
                  {answers.length} ITENS DE INSPEÇÃO
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens do Checklist */}
        {answers.length > 0 && (
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-4 border-b border-border/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                2. Itens de Inspeção Visual e Operacional
              </CardTitle>
              <CardDescription className="text-xs">
                Toque nos botões para classificar o estado de cada item
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {answers.map((item, idx) => (
                <div
                  key={item.templateItemId}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    item.status === "CRITICO"
                      ? "border-destructive/50 bg-destructive/10"
                      : item.status === "ALERTA"
                      ? "border-amber-500/50 bg-amber-500/10"
                      : item.status === "OK"
                      ? "border-emerald-500/20 bg-card/60"
                      : "border-border/30 bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">
                        Item #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    </div>
                  </div>

                  {/* Botões Touch-Friendly Grandes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant={item.status === "OK" ? "default" : "outline"}
                      onClick={() => updateItemStatus(item.templateItemId, "OK")}
                      className={`h-11 rounded-xl text-xs gap-1.5 font-bold transition-all ${
                        item.status === "OK" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      OK / Conforme
                    </Button>

                    <Button
                      type="button"
                      variant={item.status === "ALERTA" ? "default" : "outline"}
                      onClick={() => updateItemStatus(item.templateItemId, "ALERTA")}
                      className={`h-11 rounded-xl text-xs gap-1.5 font-bold transition-all ${
                        item.status === "ALERTA" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Alerta Leve
                    </Button>

                    <Button
                      type="button"
                      variant={item.status === "CRITICO" ? "default" : "outline"}
                      onClick={() => updateItemStatus(item.templateItemId, "CRITICO")}
                      className={`h-11 rounded-xl text-xs gap-1.5 font-bold transition-all ${
                        item.status === "CRITICO" ? "bg-destructive hover:bg-destructive/90 text-white" : ""
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                      Crítico / Falha
                    </Button>

                    <Button
                      type="button"
                      variant={item.status === "NAO_SE_APLICA" ? "default" : "outline"}
                      onClick={() => updateItemStatus(item.templateItemId, "NAO_SE_APLICA")}
                      className="h-11 rounded-xl text-xs gap-1.5 font-medium"
                    >
                      <MinusCircle className="h-4 w-4 text-muted-foreground" />
                      Não se Aplica
                    </Button>
                  </div>

                  {/* Campo de observação se houver Alerta ou Crítico */}
                  {(item.status === "ALERTA" || item.status === "CRITICO") && (
                    <Input
                      placeholder="Descreva o problema encontrado neste item..."
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.templateItemId, e.target.value)}
                      className="text-xs mt-2 bg-background"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Observações Gerais */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardContent className="p-6 space-y-2">
            <Label htmlFor="generalNotes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Observações Gerais do Checklist
            </Label>
            <Textarea
              id="generalNotes"
              placeholder="Informações adicionais sobre o estado da viatura ou rota..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
            />
          </CardContent>

          <CardFooter className="p-6 border-t border-border/30 flex justify-end gap-3">
            <Link href={`/${params.tenantSlug}/checklists`}>
              <Button type="button" variant="outline" className="rounded-xl">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={executeMutation.isPending || answers.length === 0}
              className="rounded-xl gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gravando Inspeção...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Concluir Checklist Diário
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Modal Pós-Checklist para Itens Críticos */}
      <Dialog open={criticalModalOpen} onOpenChange={setCriticalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg">Itens Críticos Detectados!</DialogTitle>
            <DialogDescription className="text-center text-xs">
              A inspeção do veículo <strong>{selectedVehicle?.fleetCode}</strong> foi registrada com inconformidades que comprometem a segurança ou operação.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
            <p className="font-bold">Ação recomendada:</p>
            <p>Abrir imediatamente uma <strong>Ordem de Serviço Corretiva</strong> para avaliação e reparo na oficina.</p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCriticalModalOpen(false);
                router.push(`/${params.tenantSlug}/checklists`);
              }}
              className="w-full sm:w-auto rounded-xl text-xs"
            >
              Ver Checklists
            </Button>
            <Link
              href={`/${params.tenantSlug}/ordens-servico/novo?vehicleId=${selectedVehicleId}&origin=CHECKLIST&inspectionId=${createdInspectionId}`}
              className="w-full sm:w-auto"
            >
              <Button className="w-full rounded-xl gap-2 text-xs bg-destructive hover:bg-destructive/90 text-white">
                <Wrench className="h-4 w-4" />
                Abrir OS Corretiva Agora
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
