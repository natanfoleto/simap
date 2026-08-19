"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateVehicle } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { VehicleInput, vehicleCategoryEnum, criticalityEnum, vehicleStatusEnum } from "@/lib/validations";
import { Truck, ArrowLeft, Loader2, Save } from "lucide-react";

export default function NewVehiclePage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const createVehicle = useCreateVehicle();

  const [formData, setFormData] = useState<VehicleInput>({
    fleetCode: "",
    plate: "",
    category: "ONIBUS",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
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

  const [error, setError] = useState<string | null>(null);

  const categoryOptions = [
    { value: "ONIBUS", label: "Ônibus" },
    { value: "AMBULANCIA", label: "Ambulância" },
    { value: "CARRO", label: "Carro Leve" },
    { value: "VAN", label: "Van / Utilitário" },
    { value: "CAMINHAO", label: "Caminhão" },
    { value: "MOTOCICLETA", label: "Motocicleta" },
    { value: "MAQUINA", label: "Máquina / Trator" },
    { value: "OUTRO", label: "Outro" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createVehicle.mutateAsync(formData);
      toast({
        title: "Veículo cadastrado!",
        description: `O veículo ${formData.fleetCode} (${formData.plate}) foi salvo com sucesso.`,
      });
      router.push(`/${params.tenantSlug}/veiculos`);
    } catch (err: unknown) {
      const msg = (err as Error).message || "Falha ao cadastrar veículo.";
      setError(msg);
      toast({
        title: "Erro ao cadastrar",
        description: msg,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${params.tenantSlug}/veiculos`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Cadastrar Novo Veículo
          </h1>
          <p className="text-xs text-muted-foreground">
            Insira os dados cadastrais e operacionais do veículo na frota de Jaborandi/SP
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="p-6 pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Identificação do Veículo</CardTitle>
                <CardDescription className="text-xs">Campos obrigatórios para rastreabilidade e controle</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Linha 1: Código da Frota, Placa, Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fleetCode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código da Frota *
                </Label>
                <Input
                  id="fleetCode"
                  placeholder="ex: ONB-01, AMB-04"
                  value={formData.fleetCode}
                  onChange={(e) => setFormData({ ...formData, fleetCode: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Placa do Veículo *
                </Label>
                <Input
                  id="plate"
                  placeholder="ex: ABC1D23 ou ABC-1234"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categoria *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val as VehicleInput["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Marca, Modelo, Ano, Combustível */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Marca / Fabricante *
                </Label>
                <Input
                  id="brand"
                  placeholder="ex: Mercedes-Benz, Renault"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Modelo *
                </Label>
                <Input
                  id="model"
                  placeholder="ex: OF-1721, Master"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ano de Fabricação *
                </Label>
                <Input
                  id="year"
                  type="number"
                  min={1960}
                  max={new Date().getFullYear() + 2}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 2020 })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fuelType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Combustível *
                </Label>
                <Input
                  id="fuelType"
                  placeholder="ex: DIESEL, FLEX, GASOLINA"
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Linha 3: Finalidade, Secretaria/Setor, Quilometragem Inicial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="purpose" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Finalidade / Uso Principal *
                </Label>
                <Input
                  id="purpose"
                  placeholder="ex: Transporte Escolar Rural"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Secretaria / Setor
                </Label>
                <Input
                  id="department"
                  placeholder="ex: Educação, Saúde, Obras"
                  value={formData.department || ""}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currentOdometer" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quilometragem Inicial (km)
                </Label>
                <Input
                  id="currentOdometer"
                  type="number"
                  min={0}
                  value={formData.currentOdometer}
                  onChange={(e) => setFormData({ ...formData, currentOdometer: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            {/* Linha 4: Criticidade, Status, Piloto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/20">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nível de Criticidade
                </Label>
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
                    <SelectItem value="CRITICA">Crítica (Emergência)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Operacional
                </Label>
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
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Grupo Piloto (Mês 3)</span>
                  <span className="text-[10px] text-muted-foreground">Participa do piloto inicial</span>
                </div>
                <Switch
                  checked={formData.isPilot}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPilot: checked })}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações Adicionais
              </Label>
              <Textarea
                id="notes"
                placeholder="Histórico prévio, detalhes de contratos, condições mecânicas..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/30 flex justify-end gap-3">
            <Link href={`/${params.tenantSlug}/veiculos`}>
              <Button type="button" variant="outline" className="rounded-xl">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createVehicle.isPending}
              className="rounded-xl gap-2 shadow-md shadow-primary/20"
            >
              {createVehicle.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Veículo
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
