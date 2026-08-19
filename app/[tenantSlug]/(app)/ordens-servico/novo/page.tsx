"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useVehicles } from "@/hooks/use-vehicles";
import { useCreateMaintenanceOrder } from "@/hooks/use-maintenance-orders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/formatters";
import {
  Wrench,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  DollarSign,
  AlertOctagon,
  FileCheck,
} from "lucide-react";

interface OrderItemRow {
  description: string;
  itemType: "PECA" | "SERVICO" | "OUTRO";
  quantity: number;
  unitCost: number;
}

export default function NewMaintenanceOrderPage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialVehicleId = searchParams.get("vehicleId") || "";
  const initialOrigin = searchParams.get("origin") || "OPERACIONAL";
  const initialInspectionId = searchParams.get("inspectionId") || "";

  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId);
  const [type, setType] = useState<"PREVENTIVA" | "CORRETIVA" | "INSPECAO">(
    initialOrigin === "CHECKLIST" ? "CORRETIVA" : "CORRETIVA"
  );
  const [priority, setPriority] = useState<"BAIXA" | "MEDIA" | "ALTA" | "CRITICA">("MEDIA");
  const [description, setDescription] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [providerName, setProviderName] = useState<string>("");
  const [documentReference, setDocumentReference] = useState<string>("");
  const [generateDowntime, setGenerateDowntime] = useState<boolean>(true);

  const [items, setItems] = useState<OrderItemRow[]>([
    { description: "Mão de Obra Mecânica", itemType: "SERVICO", quantity: 1, unitCost: 0 },
  ]);

  const { data: vehiclesData } = useVehicles({ limit: 100, tenantSlug: params.tenantSlug });
  const vehicles = vehiclesData?.items || [];
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const createMutation = useCreateMaintenanceOrder();

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", itemType: "PECA", quantity: 1, unitCost: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItemRow, value: unknown) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  // Cálculos automáticos de custo
  const partsTotal = items
    .filter((i) => i.itemType === "PECA")
    .reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const laborTotal = items
    .filter((i) => i.itemType === "SERVICO")
    .reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const otherTotal = items
    .filter((i) => i.itemType === "OUTRO")
    .reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const totalCost = partsTotal + laborTotal + otherTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!vehicleId) {
      toast({
        title: "Selecione o veículo",
        description: "É obrigatório selecionar o veículo da ordem de serviço.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Informe a descrição do serviço a ser realizado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        vehicleId,
        type,
        priority,
        origin: initialOrigin,
        inspectionId: initialInspectionId || null,
        description,
        diagnosis: diagnosis || null,
        providerName: providerName || null,
        documentReference: documentReference || null,
        generateDowntime,
        items: items
          .filter((it) => it.description.trim().length > 0)
          .map((it) => ({
            description: it.description,
            itemType: it.itemType,
            quantity: Number(it.quantity) || 1,
            unitCost: Number(it.unitCost) || 0,
          })),
      });

      toast({
        title: "Ordem de Serviço criada!",
        description: `OS ${created.orderNumber} registrada com sucesso.`,
      });

      router.push(`/${params.tenantSlug}/ordens-servico`);
    } catch (err: unknown) {
      toast({
        title: "Erro ao criar OS",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${params.tenantSlug}/ordens-servico`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Abertura de Ordem de Serviço
          </h1>
          <p className="text-xs text-muted-foreground">
            Registro de manutenção preventiva ou corretiva com lançamento de custos
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identificação da OS e Veículo */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-4 border-b border-border/30">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              1. Classificação e Veículo
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Veículo *
                </Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione..." />
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
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo de Manutenção *
                </Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as "PREVENTIVA" | "CORRETIVA" | "INSPECAO")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVA">Preventiva (Plano)</SelectItem>
                    <SelectItem value="CORRETIVA">Corretiva (Quebra / Falha)</SelectItem>
                    <SelectItem value="INSPECAO">Inspeção Periódica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prioridade *
                </Label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as "BAIXA" | "MEDIA" | "ALTA" | "CRITICA")}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="CRITICA">Crítica (Interdição)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descInput" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição do Problema / Serviço *
              </Label>
              <Textarea
                id="descInput"
                placeholder="Detalhe o sintoma apresentado, motivo da quebra ou procedimentos do plano..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="providerInput" className="text-xs text-muted-foreground">
                  Oficina / Prestador de Serviço
                </Label>
                <Input
                  id="providerInput"
                  placeholder="ex: Oficina Municipal / Auto Peças Jaborandi"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="docRefInput" className="text-xs text-muted-foreground">
                  Documento Fiscal / Empenho / SCPI
                </Label>
                <Input
                  id="docRefInput"
                  placeholder="ex: Empenho 1234/2026 / NF 4589"
                  value={documentReference}
                  onChange={(e) => setDocumentReference(e.target.value)}
                />
              </div>
            </div>

            {/* Controle de Indisponibilidade */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-300">
                  <AlertOctagon className="h-4 w-4" />
                  Registrar Parada do Veículo (Indisponibilidade)
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  Altera o status do veículo para <strong>EM MANUTENÇÃO</strong> e contabiliza o tempo parado
                </p>
              </div>
              <Switch checked={generateDowntime} onCheckedChange={setGenerateDowntime} />
            </div>
          </CardContent>
        </Card>

        {/* Lançamento de Itens e Custos */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                2. Peças, Serviços e Custos
              </CardTitle>
              <CardDescription className="text-xs">
                Discrimine os materiais e serviços para apuração do custo real de manutenção
              </CardDescription>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-xl gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Adicionar Item
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/30 border border-border/20 items-center">
                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Tipo</Label>
                  <Select
                    value={item.itemType}
                    onValueChange={(val) => updateItem(idx, "itemType", val)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PECA">Peça / Material</SelectItem>
                      <SelectItem value="SERVICO">Mão de Obra / Serviço</SelectItem>
                      <SelectItem value="OUTRO">Outros Custos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Descrição</Label>
                  <Input
                    placeholder="ex: Pastilha de freio dianteira"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Quantidade</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Valor Unit. (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitCost}
                    onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Resumo Consolidado de Custos */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border/30 mt-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground">Peças e Materiais:</span>
                <p className="font-bold text-foreground font-mono">{formatBRL(partsTotal)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground">Mão de Obra:</span>
                <p className="font-bold text-foreground font-mono">{formatBRL(laborTotal)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-primary">Custo Total da OS:</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatBRL(totalCost)}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/30 flex justify-end gap-3">
            <Link href={`/${params.tenantSlug}/ordens-servico`}>
              <Button type="button" variant="outline" className="rounded-xl">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Abrindo OS...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar e Abrir Ordem de Serviço
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
