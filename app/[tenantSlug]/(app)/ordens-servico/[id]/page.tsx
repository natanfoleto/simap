"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useMaintenanceOrder,
  useUpdateMaintenanceOrder,
  useCancelMaintenanceOrder,
} from "@/hooks/use-maintenance-orders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, formatDateTime, formatOdometer, formatUTCDate } from "@/lib/formatters";
import {
  Wrench,
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Truck,
  Building,
  FileText,
  AlertOctagon,
  Loader2,
  Calendar,
} from "lucide-react";

export default function MaintenanceOrderDetailPage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: order, isLoading } = useMaintenanceOrder(params.id);
  const updateMutation = useUpdateMaintenanceOrder(params.id);
  const cancelMutation = useCancelMaintenanceOrder(params.id);

  // Modais de ação
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [odometerAtClose, setOdometerAtClose] = useState<string>("");
  const [cancelReason, setCancelReason] = useState<string>("");

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-4">
        <Wrench className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Ordem de Serviço não encontrada</h2>
        <Link href={`/${params.tenantSlug}/ordens-servico`}>
          <Button variant="outline" className="rounded-xl">Voltar às ordens</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = order.status === "CONCLUIDA";
  const isCanceled = order.status === "CANCELADA";
  const isExecution = order.status === "EM_EXECUCAO";
  const isOpen = order.status === "ABERTA";

  async function handleStartExecution() {
    try {
      await updateMutation.mutateAsync({ status: "EM_EXECUCAO" });
      toast({
        title: "OS em Execução",
        description: "Status alterado para Em Execução.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  async function handleConfirmComplete() {
    const numOdo = odometerAtClose ? parseInt(odometerAtClose, 10) : undefined;
    try {
      await updateMutation.mutateAsync({
        status: "CONCLUIDA",
        odometerAtClose: numOdo,
      });
      setCompleteModalOpen(false);
      toast({
        title: "Ordem de Serviço Concluída!",
        description: "Manutenção finalizada e veículo liberado para operação.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao concluir OS",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  async function handleConfirmCancel() {
    if (!cancelReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo do cancelamento.",
        variant: "destructive",
      });
      return;
    }

    try {
      await cancelMutation.mutateAsync(cancelReason);
      setCancelModalOpen(false);
      toast({
        title: "OS Cancelada",
        description: "Ordem de serviço cancelada com sucesso.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao cancelar",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  const statusBadges: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "neutral" }> = {
    RASCUNHO: { label: "Rascunho", variant: "neutral" },
    AGENDADA: { label: "Agendada", variant: "neutral" },
    ABERTA: { label: "Aberta", variant: "warning" },
    EM_EXECUCAO: { label: "Em Execução", variant: "default" },
    CONCLUIDA: { label: "Concluída", variant: "success" },
    CANCELADA: { label: "Cancelada", variant: "destructive" },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/${params.tenantSlug}/ordens-servico`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground font-mono">
                {order.orderNumber}
              </h1>
              <Badge variant={statusBadges[order.status]?.variant || "neutral"}>
                {statusBadges[order.status]?.label || order.status}
              </Badge>
              <Badge variant="outline" className="text-xs uppercase">
                {order.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aberta em {formatDateTime(order.openedAt)} • Origem: {order.origin}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        {!isCompleted && !isCanceled && (
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button
                variant="outline"
                onClick={handleStartExecution}
                disabled={updateMutation.isPending}
                className="rounded-2xl gap-1.5 text-xs shadow-sm"
              >
                <Play className="h-3.5 w-3.5 text-primary" />
                Iniciar Execução
              </Button>
            )}

            <Button
              onClick={() => {
                setOdometerAtClose(order.vehicle?.currentOdometer ? String(order.vehicle.currentOdometer) : "");
                setCompleteModalOpen(true);
              }}
              className="rounded-2xl gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir Ordem de Serviço
            </Button>

            <Button
              variant="ghost"
              onClick={() => setCancelModalOpen(true)}
              className="rounded-2xl text-destructive hover:bg-destructive/10 text-xs"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Detalhes da Ordem */}
        <Card className="md:col-span-2 rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-6 pb-4 border-b border-border/30">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Diagnóstico e Escopo dos Serviços
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Descrição do Serviço:</span>
              <p className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-2xl border border-border/20">
                {order.description}
              </p>
            </div>

            {order.diagnosis && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Diagnóstico Técnico da Oficina:</span>
                <p className="text-sm text-foreground/90 bg-muted/10 p-3 rounded-2xl border border-border/10">
                  {order.diagnosis}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-2xl bg-muted/20 border border-border/20 space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Oficina / Fornecedor:</span>
                <p className="text-xs font-bold text-foreground">{order.providerName || "Oficina Própria"}</p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/20 border border-border/20 space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Documento Fiscal / Empenho:</span>
                <p className="text-xs font-bold font-mono text-foreground">{order.documentReference || "Não informado"}</p>
              </div>
            </div>

            {order.canceledAt && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
                <span className="font-bold">Ordem Cancelada em {formatDateTime(order.canceledAt)}:</span>
                <p>{order.cancelReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Veículo */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md h-fit">
          <CardHeader className="p-6 pb-4 border-b border-border/30">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Veículo Atendido
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <span className="text-muted-foreground">Código / Placa:</span>
              <span className="font-bold text-foreground font-mono">
                {order.vehicle?.fleetCode} ({order.vehicle?.plate})
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <span className="text-muted-foreground">Modelo:</span>
              <span className="font-medium text-foreground">{order.vehicle?.model}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <span className="text-muted-foreground">Categoria:</span>
              <Badge variant="neutral" className="text-[10px]">{order.vehicle?.category}</Badge>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <span className="text-muted-foreground">Hodômetro Atual:</span>
              <span className="font-bold font-mono text-foreground">
                {formatOdometer(order.vehicle?.currentOdometer)}
              </span>
            </div>

            <div className="pt-2">
              <Link href={`/${params.tenantSlug}/veiculos/${order.vehicle?.id}`}>
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                  Ver Ficha do Veículo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Peças e Serviços Lançados */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Itens de Peças e Mão de Obra Lançados
          </CardTitle>
          <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Total: {formatBRL(Number(order.totalCost))}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {!order.items || order.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhum item discriminado nesta ordem de serviço.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it: {
                  id: string;
                  itemType: string;
                  description: string;
                  quantity: number;
                  unitCost: number;
                  totalCost: number;
                }) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <Badge variant="neutral" className="text-[10px]">
                        {it.itemType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {it.description}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {Number(it.quantity)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatBRL(Number(it.unitCost))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs font-mono text-foreground">
                      {formatBRL(Number(it.totalCost))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Conclusão da OS */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Confirme a finalização dos reparos da OS <strong>{order.orderNumber}</strong>. O veículo retornará ao status operacional <strong>ATIVO</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="closeOdo" className="text-xs font-semibold text-muted-foreground">
                Hodômetro de Saída da Oficina (km)
              </Label>
              <Input
                id="closeOdo"
                type="number"
                placeholder="ex: 125480"
                value={odometerAtClose}
                onChange={(e) => setOdometerAtClose(e.target.value)}
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              Valor Total Consolidado da Manutenção: <strong>{formatBRL(Number(order.totalCost))}</strong>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCompleteModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmComplete}
              disabled={updateMutation.isPending}
              className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Informe a justificativa para o cancelamento da OS <strong>{order.orderNumber}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Motivo do cancelamento (obrigatório)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} className="rounded-xl">
              Voltar
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
              className="rounded-xl gap-2 bg-destructive hover:bg-destructive/90 text-white"
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
