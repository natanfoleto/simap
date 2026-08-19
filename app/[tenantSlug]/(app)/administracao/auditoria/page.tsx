"use client";

import React, { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/formatters";
import { ScrollText, Search, ChevronLeft, ChevronRight, Eye, ShieldAlert } from "lucide-react";

export default function AuditAdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    oldValues: unknown;
    newValues: unknown;
    user?: { name: string; email: string; role: string } | null;
    createdAt: string;
    ipAddress?: string | null;
  } | null>(null);

  const { data, isLoading } = useAuditLogs({
    page,
    limit: 20,
    search: search.trim() || undefined,
  });

  const logs = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Trilha de Auditoria do Sistema
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro cronológico e imutável de todas as mutações e eventos críticos da frota municipal
        </p>
      </div>

      {/* Search Bar */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardContent className="p-4 md:p-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ação, entidade, usuário ou ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Histórico de Eventos
          </CardTitle>
          <CardDescription className="text-xs">
            Exibindo {logs.length} de {pagination.total} registros de auditoria
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data e Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>ID Registro</TableHead>
                  <TableHead>Usuário Executor</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: {
                  id: string;
                  action: string;
                  entity: string;
                  entityId: string;
                  oldValues: unknown;
                  newValues: unknown;
                  user?: { name: string; email: string; role: string } | null;
                  createdAt: string;
                  ipAddress?: string | null;
                }) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {log.entity}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.entityId.length > 15 ? `${log.entityId.slice(0, 10)}...` : log.entityId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-foreground">{log.user?.name || "Sistema"}</span>
                        <span className="text-[10px] text-muted-foreground">{log.user?.email || "seed / autônomo"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 w-8 rounded-lg hover:bg-muted"
                        title="Ver payload"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="rounded-xl h-8 gap-1 text-xs"
              >
                Próxima
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Detalhes do Log */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Detalhes do Evento de Auditoria
            </DialogTitle>
            <DialogDescription>
              Identificador do log: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/20">
                <div>
                  <span className="font-semibold text-muted-foreground">Ação:</span>
                  <p className="font-bold text-foreground">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Entidade:</span>
                  <p className="font-bold text-foreground">{selectedLog.entity} ({selectedLog.entityId})</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Data/Hora:</span>
                  <p className="text-foreground">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Executor:</span>
                  <p className="text-foreground">{selectedLog.user?.name || "Sistema"} ({selectedLog.user?.role || "SYSTEM"})</p>
                </div>
              </div>

              {selectedLog.oldValues !== null && selectedLog.oldValues !== undefined && (
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">Valores Anteriores (oldValues):</span>
                  <pre className="p-3 rounded-xl bg-muted/40 font-mono text-[11px] overflow-x-auto border border-border/30">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues !== null && selectedLog.newValues !== undefined && (
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground uppercase text-[10px]">Novos Valores (newValues):</span>
                  <pre className="p-3 rounded-xl bg-muted/40 font-mono text-[11px] overflow-x-auto border border-border/30">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
