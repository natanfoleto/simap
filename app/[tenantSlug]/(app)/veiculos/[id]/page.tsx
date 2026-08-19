"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatOdometer, formatUTCDate } from "@/lib/formatters";
import { VehicleInput } from "@/lib/validations";
import {
  Truck,
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  CalendarCheck,
  Building,
  Fuel,
  Hash,
  Clock,
  Gauge,
  Shield,
} from "lucide-react";

export default function VehicleDetailPage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: vehicle, isLoading } = useVehicle(params.id);
  const updateVehicle = useUpdateVehicle(params.id);
  const deleteVehicle = useDeleteVehicle();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VehicleInput>({
    fleetCode: "",
    plate: "",
    category: "ONIBUS",
    brand: "",
    model: "",
    year: 2022,
    fuelType: "DIESEL",
    purpose: "",
    department: "",
    criticality: "MEDIA",
    status: "ATIVO",
    currentOdometer: 0,
    isPilot: false,
    active: true,
    notes: "",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        fleetCode: vehicle.fleetCode,
        plate: vehicle.plate,
        category: vehicle.category as VehicleInput["category"],
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        purpose: vehicle.purpose,
        department: vehicle.department || "",
        criticality: vehicle.criticality as VehicleInput["criticality"],
        status: vehicle.status as VehicleInput["status"],
        currentOdometer: vehicle.currentOdometer,
        isPilot: vehicle.isPilot,
        active: vehicle.active,
        notes: vehicle.notes || "",
      });
    }
  }, [vehicle]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <Truck className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Veículo não encontrado</h2>
        <Link href={`/${params.tenantSlug}/veiculos`}>
          <Button variant="outline" className="rounded-xl">Voltar à frota</Button>
        </Link>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    try {
      await updateVehicle.mutateAsync(formData);
      setIsEditing(false);
      toast({
        title: "Veículo atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: (err as Error).message || "Falha na atualização.",
        variant: "destructive",
      });
    }
  }

  async function handleInactivate() {
    if (!vehicle) return;
    if (!confirm(`Deseja realmente inativar o veículo ${vehicle.fleetCode}?`)) return;

    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      toast({
        title: "Veículo inativado",
        description: "Status alterado para inativo.",
      });
      router.push(`/${params.tenantSlug}/veiculos`);
    } catch (err: unknown) {
      toast({
        title: "Erro",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  const activePlan = vehicle.preventivePlans?.[0]?.plan;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.tenantSlug}/veiculos`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {vehicle.fleetCode} — {vehicle.model}
              </h1>
              <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-lg border border-border/40">
                {vehicle.plate}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastrado em {formatUTCDate(vehicle.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Link href={`/${params.tenantSlug}/veiculos/${vehicle.id}/timeline`}>
                <Button variant="outline" className="rounded-2xl gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  Linha do Tempo
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="rounded-2xl text-xs"
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                onClick={handleInactivate}
                className="rounded-2xl text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="rounded-2xl text-xs"
            >
              Cancelar Edição
            </Button>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <form onSubmit={handleSave}>
          <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Ficha Técnica e Operacional</CardTitle>
                <CardDescription className="text-xs">Dados de controle da frota municipal</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={vehicle.status === "ATIVO" ? "success" : "neutral"}>
                {vehicle.status}
              </Badge>
              {vehicle.isPilot && (
                <Badge variant="default" className="text-[10px]">
                  GRUPO PILOTO
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {!isEditing ? (
              // Modo Visualização
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" /> Código & Placa
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {vehicle.fleetCode} ({vehicle.plate})
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Marca & Modelo
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" /> Hodômetro Atual
                  </span>
                  <p className="text-base font-bold text-foreground">
                    {formatOdometer(vehicle.currentOdometer)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5" /> Combustível & Categoria
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {vehicle.fuelType} • {vehicle.category}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Secretaria / Finalidade
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {vehicle.department || "Não informado"} • {vehicle.purpose}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Criticidade
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    Nível {vehicle.criticality}
                  </p>
                </div>

                {vehicle.notes && (
                  <div className="col-span-full space-y-1 p-4 rounded-2xl bg-muted/30 border border-border/20">
                    <span className="text-xs font-semibold text-muted-foreground">Observações:</span>
                    <p className="text-sm text-foreground/90">{vehicle.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              // Modo Edição
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fleetCode">Código da Frota</Label>
                    <Input
                      id="fleetCode"
                      value={formData.fleetCode}
                      onChange={(e) => setFormData({ ...formData, fleetCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plate">Placa</Label>
                    <Input
                      id="plate"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val as VehicleInput["category"] })}
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

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2020 })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fuelType">Combustível</Label>
                    <Input
                      id="fuelType"
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="purpose">Finalidade / Uso</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="department">Secretaria / Setor</Label>
                    <Input
                      id="department"
                      value={formData.department || ""}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currentOdometer">Hodômetro Atual (km)</Label>
                    <Input
                      id="currentOdometer"
                      type="number"
                      value={formData.currentOdometer}
                      onChange={(e) => setFormData({ ...formData, currentOdometer: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/20">
                  <div className="space-y-1.5">
                    <Label>Criticidade</Label>
                    <Select
                      value={formData.criticality}
                      onValueChange={(val) => setFormData({ ...formData, criticality: val as VehicleInput["criticality"] })}
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

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) => setFormData({ ...formData, status: val as VehicleInput["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="MANUTENCAO">Em Manutenção</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/30 bg-muted/20 mt-4">
                    <span className="text-xs font-bold">Grupo Piloto</span>
                    <Switch
                      checked={formData.isPilot}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPilot: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>

          {isEditing && (
            <CardFooter className="p-6 border-t border-border/30 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={updateVehicle.isPending} className="rounded-xl gap-2">
                {updateVehicle.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Plano Preventivo Vinculado */}
      <Card className="rounded-3xl border-border/40 bg-card/30 backdrop-blur-md">
        <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Plano de Manutenção Preventiva</CardTitle>
              <CardDescription className="text-xs">Regras e procedimentos aplicados a esta categoria</CardDescription>
            </div>
          </div>

          <Link href={`/${params.tenantSlug}/planos-preventivos`}>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs">
              Ver todos os planos
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-6">
          {activePlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/20">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{activePlan.name}</h4>
                  <p className="text-xs text-muted-foreground">Versão {activePlan.version} • {activePlan.category}</p>
                </div>
                <Badge variant="success">PLANO VINCULADO</Badge>
              </div>

              {activePlan.items && activePlan.items.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens Preventivos:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activePlan.items.map((item: {
                      id: string;
                      name: string;
                      intervalKm?: number;
                      intervalDays?: number;
                      priority: string;
                    }) => (
                      <div key={item.id} className="p-3 rounded-xl border border-border/30 bg-card/40 space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-foreground">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.priority}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                          {item.intervalKm && <span>A cada {item.intervalKm.toLocaleString("pt-BR")} km</span>}
                          {item.intervalDays && <span>A cada {item.intervalDays} dias</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center space-y-2">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                Nenhum plano preventivo explicitamente vinculado. O plano padrão da categoria {vehicle.category} será sugerido.
              </p>
              <Link href={`/${params.tenantSlug}/planos-preventivos`}>
                <Button size="sm" variant="outline" className="rounded-xl mt-2 text-xs">
                  Vincular Plano
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
