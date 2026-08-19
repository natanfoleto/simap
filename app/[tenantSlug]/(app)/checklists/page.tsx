"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInspections } from "@/hooks/use-checklists";
import { useVehicles } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime, formatOdometer } from "@/lib/formatters";
import {
  ClipboardCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Eye,
  ShieldAlert,
} from "lucide-react";

export default function ChecklistsPage({ params }: { params: { tenantSlug: string } }) {
  const [filterVehicleId, setFilterVehicleId] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data: vehiclesData } = useVehicles({ limit: 100, tenantSlug: params.tenantSlug });
  const { data: inspectionsData, isLoading } = useInspections({
    page,
    limit: 20,
    vehicleId: filterVehicleId || undefined,
  });

  const vehicles = vehiclesData?.items || [];
  const inspections = inspectionsData?.items || [];
  const pagination = inspectionsData?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Checklists Operacionais Diários
            </h1>
            <Badge variant="success" className="text-xs">
              Mês 3
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Inspeções preventivas diárias realizadas por motoristas e operadores da frota municipal
          </p>
        </div>

        <Link href={`/${params.tenantSlug}/checklists/executar`}>
          <Button className="rounded-2xl gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Executar Checklist Diário
          </Button>
        </Link>
      </div>

      {/* Tabela de Histórico de Inspeções */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Histórico de Inspeções Realizadas
            </CardTitle>
            <CardDescription className="text-xs">
              Exibindo {inspections.length} de {pagination.total} inspeções registradas
            </CardDescription>
          </div>

          <div className="w-full sm:w-56">
            <Select value={filterVehicleId} onValueChange={(val) => { setFilterVehicleId(val === "ALL" ? "" : val); setPage(1); }}>
              <SelectTrigger className="h-8 rounded-xl text-xs">
                <SelectValue placeholder="Filtrar por veículo..." />
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
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : inspections.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhum checklist registrado ainda.</p>
              <p className="text-xs">Clique no botão acima para registrar a primeira inspeção diária.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Template de Inspeção</TableHead>
                  <TableHead>Hodômetro</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Motorista / Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((insp: {
                  id: string;
                  performedAt: string;
                  odometer: number;
                  status: string;
                  hasAlert: boolean;
                  hasCritical: boolean;
                  vehicle: { fleetCode: string; plate: string; model: string; category: string };
                  user: { name: string; role: string };
                  template: { name: string };
                }) => (
                  <TableRow key={insp.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {formatDateTime(insp.performedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{insp.vehicle?.fleetCode}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{insp.vehicle?.plate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {insp.template?.name}
                    </TableCell>
                    <TableCell className="font-bold text-xs font-mono text-foreground">
                      {formatOdometer(insp.odometer)}
                    </TableCell>
                    <TableCell>
                      {insp.hasCritical ? (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <XCircle className="h-3 w-3" />
                          CRÍTICO
                        </Badge>
                      ) : insp.hasAlert ? (
                        <Badge variant="warning" className="gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          ALERTA
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          APROVADO
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {insp.user?.name}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
