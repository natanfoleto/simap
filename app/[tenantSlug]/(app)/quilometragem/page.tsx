"use client";

import React, { useState } from "react";
import { useOdometerReadings, useRegisterOdometer } from "@/hooks/use-odometer";
import { useVehicles } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime, formatOdometer } from "@/lib/formatters";
import {
  Gauge,
  Plus,
  ArrowUpDown,
  History,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Truck,
} from "lucide-react";

export default function OdometerPage({ params }: { params: { tenantSlug: string } }) {
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [reading, setReading] = useState<string>("");
  const [isCorrection, setIsCorrection] = useState<boolean>(false);
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [filterVehicleId, setFilterVehicleId] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Queries
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useVehicles({
    limit: 100,
    tenantSlug: params.tenantSlug,
  });

  const { data: readingsData, isLoading: isLoadingReadings } = useOdometerReadings({
    page,
    limit: 15,
    vehicleId: filterVehicleId || undefined,
  });

  const registerMutation = useRegisterOdometer();

  const vehicles = vehiclesData?.items || [];
  const readings = readingsData?.items || [];
  const pagination = readingsData?.pagination || { total: 0, page: 1, totalPages: 1 };

  const currentSelectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedVehicleId) {
      toast({
        title: "Selecione um veículo",
        description: "É necessário escolher o veículo para registrar a quilometragem.",
        variant: "destructive",
      });
      return;
    }

    const numReading = parseInt(reading, 10);
    if (isNaN(numReading) || numReading < 0) {
      toast({
        title: "Quilometragem inválida",
        description: "Informe um valor numérico válido maior ou igual a zero.",
        variant: "destructive",
      });
      return;
    }

    if (
      currentSelectedVehicle &&
      numReading < currentSelectedVehicle.currentOdometer &&
      !isCorrection
    ) {
      toast({
        title: "Regressão de hodômetro detectada",
        description: `O valor (${numReading} km) é menor que o atual (${currentSelectedVehicle.currentOdometer} km). Ative a opção de correção regressiva com justificativa.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        vehicleId: selectedVehicleId,
        reading: numReading,
        isCorrection,
        correctionReason: isCorrection ? correctionReason : null,
        notes: notes || null,
      });

      toast({
        title: "Leitura registrada com sucesso!",
        description: `${currentSelectedVehicle?.fleetCode}: ${formatOdometer(numReading)}`,
      });

      // Limpa formulário
      setReading("");
      setIsCorrection(false);
      setCorrectionReason("");
      setNotes("");
    } catch (err: unknown) {
      toast({
        title: "Erro ao registrar",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Controle de Hodômetro & Quilometragem
          </h1>
          <Badge variant="default" className="text-xs">
            Operação R1
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Registro diário de quilometragem, histórico de leituras e controle rigoroso de progressão
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Registro Rápido */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-sm h-fit">
          <form onSubmit={handleRegister}>
            <CardHeader className="p-6 pb-4 border-b border-border/30">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Registrar Hodômetro
              </CardTitle>
              <CardDescription className="text-xs">
                Lançamento rápido para motoristas e operadores
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
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

              {currentSelectedVehicle && (
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Última Leitura:</span>
                  <span className="font-bold font-mono text-foreground text-sm">
                    {formatOdometer(currentSelectedVehicle.currentOdometer)}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="readingKm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nova Leitura (km) *
                </Label>
                <Input
                  id="readingKm"
                  type="number"
                  placeholder="ex: 125480"
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  required
                  min={0}
                />
              </div>

              {/* Opção de Correção Regressiva */}
              <div className="pt-2 border-t border-border/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Correção Regressiva</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Permite valor inferior ao hodômetro atual
                    </p>
                  </div>
                  <Switch checked={isCorrection} onCheckedChange={setIsCorrection} />
                </div>

                {isCorrection && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <Label htmlFor="correctionReason" className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Justificativa Obrigatória *
                    </Label>
                    <Textarea
                      id="correctionReason"
                      placeholder="Motivo da correção (ex: erro de digitação anterior, troca de painel...)"
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      required={isCorrection}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs text-muted-foreground">
                  Observações (Opcional)
                </Label>
                <Input
                  id="notes"
                  placeholder="ex: Final de turno / Rota escolar"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full rounded-2xl gap-2 shadow-md shadow-primary/20 mt-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar Leitura
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Tabela de Histórico de Leituras */}
        <Card className="lg:col-span-2 overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
          <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Leituras
              </CardTitle>
              <CardDescription className="text-xs">
                Registros cronológicos capturados por manual, checklist e ordens de serviço
              </CardDescription>
            </div>

            <div className="w-full sm:w-56">
              <Select value={filterVehicleId} onValueChange={(val) => { setFilterVehicleId(val === "ALL" ? "" : val); setPage(1); }}>
                <SelectTrigger className="h-8 rounded-xl text-xs">
                  <SelectValue placeholder="Filtrar veículo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Veículos</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.fleetCode} — {v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoadingReadings ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : readings.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2">
                <Gauge className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-xs">Nenhuma leitura de hodômetro registrada até o momento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Quilometragem</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Registrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((r: {
                    id: string;
                    readingDate: string;
                    reading: number;
                    source: string;
                    isCorrection: boolean;
                    correctionReason?: string;
                    vehicle: { fleetCode: string; plate: string; model: string };
                    user?: { name: string; role: string };
                  }) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatDateTime(r.readingDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-foreground">
                            {r.vehicle?.fleetCode}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {r.vehicle?.plate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-sm font-mono text-foreground">
                        {formatOdometer(r.reading)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="neutral" className="text-[10px] uppercase">
                            {r.source}
                          </Badge>
                          {r.isCorrection && (
                            <Badge variant="warning" className="text-[9px]">
                              CORREÇÃO
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.user?.name || "Sistema"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
