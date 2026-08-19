"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMaintenanceOrders } from "@/hooks/use-maintenance-orders";
import { useVehicles } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL, formatDateTime, formatUTCDate } from "@/lib/formatters";
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Truck,
  Eye,
  Filter,
} from "lucide-react";

export default function MaintenanceOrdersPage({ params }: { params: { tenantSlug: string } }) {
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterVehicleId, setFilterVehicleId] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const { data: vehiclesData } = useVehicles({ limit: 100, tenantSlug: params.tenantSlug });
  const { data: ordersData, isLoading } = useMaintenanceOrders({
    page,
    limit: 20,
    type: filterType || undefined,
    status: filterStatus || undefined,
    vehicleId: filterVehicleId || undefined,
  });

  const vehicles = vehiclesData?.items || [];
  const orders = ordersData?.items || [];
  const pagination = ordersData?.pagination || { total: 0, page: 1, totalPages: 1 };

  const statusBadges: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "neutral" }> = {
    RASCUNHO: { label: "Rascunho", variant: "neutral" },
    AGENDADA: { label: "Agendada", variant: "neutral" },
    ABERTA: { label: "Aberta", variant: "warning" },
    EM_EXECUCAO: { label: "Em Execução", variant: "default" },
    CONCLUIDA: { label: "Concluída", variant: "success" },
    CANCELADA: { label: "Cancelada", variant: "destructive" },
  };

  const typeBadges: Record<string, { label: string; className: string }> = {
    PREVENTIVA: { label: "Preventiva", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
    CORRETIVA: { label: "Corretiva", className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" },
    INSPECAO: { label: "Inspeção", className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Ordens de Serviço de Manutenção
            </h1>
            <Badge variant="default" className="text-xs">
              Mês 3
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Controle operacional e financeiro de manutenções preventivas e corretivas da frota
          </p>
        </div>

        <Link href={`/${params.tenantSlug}/ordens-servico/novo`}>
          <Button className="rounded-2xl gap-2 shadow-md shadow-primary/20 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Nova Ordem de Serviço
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-sm">
        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Tipo de Manutenção</label>
            <Select value={filterType} onValueChange={(val) => { setFilterType(val === "ALL" ? "" : val); setPage(1); }}>
              <SelectTrigger className="rounded-xl h-9 text-xs">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                <SelectItem value="INSPECAO">Inspeção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Status da Ordem</label>
            <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val === "ALL" ? "" : val); setPage(1); }}>
              <SelectTrigger className="rounded-xl h-9 text-xs">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="ABERTA">Aberta</SelectItem>
                <SelectItem value="EM_EXECUCAO">Em Execução</SelectItem>
                <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Veículo</label>
            <Select value={filterVehicleId} onValueChange={(val) => { setFilterVehicleId(val === "ALL" ? "" : val); setPage(1); }}>
              <SelectTrigger className="rounded-xl h-9 text-xs">
                <SelectValue placeholder="Todos os veículos" />
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
        </CardContent>
      </Card>

      {/* Tabela de Ordens */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Ordens de Serviço Registradas
          </CardTitle>
          <CardDescription className="text-xs">
            Exibindo {orders.length} de {pagination.total} ordens no filtro atual
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Wrench className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhuma ordem de serviço encontrada.</p>
              <p className="text-xs">Clique no botão acima para abrir uma nova OS.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Número OS</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição do Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Custo Total</TableHead>
                  <TableHead>Abertura</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((ord: {
                  id: string;
                  orderNumber: string;
                  type: string;
                  status: string;
                  priority: string;
                  description: string;
                  totalCost: number;
                  openedAt: string;
                  vehicle: { fleetCode: string; plate: string; model: string };
                  providerName?: string;
                }) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono font-bold text-xs text-primary whitespace-nowrap">
                      {ord.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{ord.vehicle?.fleetCode}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{ord.vehicle?.plate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadges[ord.type]?.className}`}>
                        {typeBadges[ord.type]?.label || ord.type}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <p className="text-xs text-foreground truncate">{ord.description}</p>
                      {ord.providerName && (
                        <span className="text-[10px] text-muted-foreground">Oficina: {ord.providerName}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadges[ord.status]?.variant || "neutral"} className="text-[10px]">
                        {statusBadges[ord.status]?.label || ord.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-foreground whitespace-nowrap">
                      {formatBRL(Number(ord.totalCost))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatUTCDate(ord.openedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/${params.tenantSlug}/ordens-servico/${ord.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 gap-1.5 text-xs">
                          <Eye className="h-3.5 w-3.5" />
                          Detalhes
                        </Button>
                      </Link>
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
