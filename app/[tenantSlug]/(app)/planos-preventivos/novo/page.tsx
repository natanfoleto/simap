"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreatePreventivePlan } from "@/hooks/use-preventive-plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PreventivePlanInput } from "@/lib/validations";
import {
  CalendarCheck,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Info,
} from "lucide-react";

export default function NewPreventivePlanPage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const createPlan = useCreatePreventivePlan();

  const [formData, setFormData] = useState<PreventivePlanInput>({
    name: "",
    category: "ONIBUS",
    description: "",
    isPublished: true,
    items: [
      {
        name: "Troca de Óleo do Motor e Filtros",
        description: "Substituição completa do óleo e elementos filtrantes",
        intervalKm: 10000,
        intervalDays: 90,
        toleranceKm: 500,
        toleranceDays: 7,
        priority: "ALTA",
        isMandatory: true,
        orderIndex: 0,
      },
    ],
  });

  const [error, setError] = useState<string | null>(null);

  function addItem() {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          name: "",
          description: "",
          intervalKm: 10000,
          intervalDays: 180,
          toleranceKm: 500,
          toleranceDays: 15,
          priority: "MEDIA",
          isMandatory: true,
          orderIndex: formData.items.length,
        },
      ],
    });
  }

  function removeItem(index: number) {
    if (formData.items.length <= 1) {
      toast({
        title: "Atenção",
        description: "O plano deve conter ao menos um item de manutenção.",
        variant: "destructive",
      });
      return;
    }
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  }

  function updateItem(index: number, field: string, value: unknown) {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validação básica dos itens
    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      if (!it.name.trim()) {
        setError(`O item ${i + 1} precisa ter um nome preenchido.`);
        return;
      }
      if (!it.intervalKm && !it.intervalDays) {
        setError(`O item "${it.name}" precisa ter ao menos um intervalo definido (km ou dias).`);
        return;
      }
    }

    try {
      await createPlan.mutateAsync(formData);
      toast({
        title: "Plano criado!",
        description: `O plano "${formData.name}" foi salvo com sucesso.`,
      });
      router.push(`/${params.tenantSlug}/planos-preventivos`);
    } catch (err: unknown) {
      const msg = (err as Error).message || "Falha ao criar plano.";
      setError(msg);
      toast({
        title: "Erro ao salvar",
        description: msg,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${params.tenantSlug}/planos-preventivos`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Novo Plano Preventivo
          </h1>
          <p className="text-xs text-muted-foreground">
            Defina periodicidades e regras de vencimento (por km, tempo ou ambos)
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="p-6 pb-4 border-b border-border/30">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Identificação do Plano
            </CardTitle>
            <CardDescription className="text-xs">
              Informe a categoria de frota e a descrição do plano preventivo
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="planName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome do Plano *
                </Label>
                <Input
                  id="planName"
                  placeholder="ex: Plano Preventivo — Ônibus Escolar e Coletivo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categoria Aplicável *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val as PreventivePlanInput["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONIBUS">Ônibus</SelectItem>
                    <SelectItem value="AMBULANCIA">Ambulância</SelectItem>
                    <SelectItem value="CARRO">Carro Leve</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="CAMINHAO">Caminhão</SelectItem>
                    <SelectItem value="MOTOCICLETA">Motocicleta</SelectItem>
                    <SelectItem value="MAQUINA">Máquina</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição do Plano
              </Label>
              <Textarea
                id="description"
                placeholder="Objetivos do plano, normas técnicas e orientações aos operadores..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Seção dos Itens Preventivos */}
            <div className="pt-4 border-t border-border/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Itens de Manutenção e Intervenção</h3>
                  <p className="text-xs text-muted-foreground">
                    A manutenção preventiva vence pelo <strong>primeiro limite atingido</strong> (quilômetros ou dias).
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-xl gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-border/40 bg-card/60 space-y-4 relative"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/20">
                      <span className="text-xs font-bold text-primary">Item #{idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(idx)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome do Procedimento / Peça *</Label>
                        <Input
                          placeholder="ex: Troca de Pastilhas de Freio"
                          value={item.name}
                          onChange={(e) => updateItem(idx, "name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Intervalo em km</Label>
                        <Input
                          type="number"
                          placeholder="ex: 10000"
                          value={item.intervalKm || ""}
                          onChange={(e) => updateItem(idx, "intervalKm", parseInt(e.target.value, 10) || null)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Intervalo em Dias</Label>
                        <Input
                          type="number"
                          placeholder="ex: 90"
                          value={item.intervalDays || ""}
                          onChange={(e) => updateItem(idx, "intervalDays", parseInt(e.target.value, 10) || null)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Antecedência Alerta (km)</Label>
                        <Input
                          type="number"
                          placeholder="ex: 500"
                          value={item.toleranceKm || ""}
                          onChange={(e) => updateItem(idx, "toleranceKm", parseInt(e.target.value, 10) || null)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Antecedência Alerta (dias)</Label>
                        <Input
                          type="number"
                          placeholder="ex: 7"
                          value={item.toleranceDays || ""}
                          onChange={(e) => updateItem(idx, "toleranceDays", parseInt(e.target.value, 10) || null)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Prioridade</Label>
                        <Select
                          value={item.priority}
                          onValueChange={(val) => updateItem(idx, "priority", val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BAIXA">Baixa</SelectItem>
                            <SelectItem value="MEDIA">Média</SelectItem>
                            <SelectItem value="ALTA">Alta</SelectItem>
                            <SelectItem value="CRITICA">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/30 flex justify-end gap-3">
            <Link href={`/${params.tenantSlug}/planos-preventivos`}>
              <Button type="button" variant="outline" className="rounded-xl">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createPlan.isPending}
              className="rounded-xl gap-2 shadow-md shadow-primary/20"
            >
              {createPlan.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Plano Preventivo
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
