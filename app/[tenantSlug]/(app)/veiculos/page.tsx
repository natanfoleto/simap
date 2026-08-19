"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useVehicles, useDeleteVehicle } from "@/hooks/use-vehicles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatOdometer } from "@/lib/formatters";
import { useToast } from "@/components/ui/use-toast";
import {
  Truck,
  Plus,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  FilterX,
} from "lucide-react";

export default function VehiclesPage({ params }: { params: { tenantSlug: string } }) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const { data, isLoading, isFetching } = useVehicles({
    page,
    limit: 15,
    search: search.trim() || undefined,
    category: category || undefined,
    status: status || undefined,
    tenantSlug: params.tenantSlug,
  });

  const deleteVehicle = useDeleteVehicle();

  const vehicles = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  function handleExportCsv() {
    const searchParams = new URLSearchParams();
    if (search.trim()) searchParams.set("search", search.trim());
    if (category) searchParams.set("category", category);
    if (status) searchParams.set("status", status);

    window.open(`/api/vehicles/export?${searchParams.toString()}`, "_blank");
  }

  async function handleInactivate(id: string, code: string) {
    if (!confirm(`Deseja realmente inativar o veículo ${code}?`)) return;

    try {
      await deleteVehicle.mutateAsync(id);
      toast({
        title: "Veículo inativado",
        description: `O veículo ${code} foi inativado com sucesso.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro",
        description: (err as Error).message || "Falha ao inativar veículo.",
        variant: "destructive",
      });
    }
  }

  const categoryLabels: Record<string, string> = {
    ONIBUS: "Ônibus",
    CARRO: "Carro",
    AMBULANCIA: "Ambulância",
    VAN: "Van",
    CAMINHAO: "Caminhão",
    MOTOCICLETA: "Motocicleta",
    MAQUINA: "Máquina",
    OUTRO: "Outro",
  };

  const statusVariants: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
    ATIVO: "success",
    MANUTENCAO: "warning",
    INATIVO: "neutral",
  };

  const criticalityVariants: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
    BAIXA: "neutral",
    MEDIA: "warning",
    ALTA: "destructive",
    CRITICA: "destructive",
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Frota de Veículos Públicos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro, classificação e monitoramento dos veículos municipais de Jaborandi/SP
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleExportCsv} className="rounded-2xl gap-2 shadow-sm">
            <Download className="h-4 w-4 text-primary" />
            Exportar CSV
          </Button>

          <Link href={`/${params.tenantSlug}/veiculos/novo`}>
            <Button className="rounded-2xl gap-2 shadow-md shadow-primary/20">
              <Plus className="h-4 w-4" />
              Novo Veículo
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, código, modelo ou secretaria..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val === "ALL" ? "" : val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as categorias</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val === "ALL" ? "" : val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="MANUTENCAO">Em Manutenção</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>

              {(search || category || status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setStatus("");
                    setPage(1);
                  }}
                  title="Limpar filtros"
                  className="shrink-0"
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table / Content */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Listagem da Frota</CardTitle>
            <CardDescription className="text-xs">
              Exibindo {vehicles.length} de {pagination.total} veículos encontrados
            </CardDescription>
          </div>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">Atualizando...</span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-muted/40 text-muted-foreground">
                <Truck className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">Nenhum veículo encontrado</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Não foram encontrados veículos para os filtros aplicados.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link href={`/${params.tenantSlug}/veiculos/novo`}>
                  <Button size="sm" className="rounded-xl gap-2">
                    <Plus className="h-4 w-4" />
                    Cadastrar Veículo
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px] min-w-[150px]">Cód. Frota</TableHead>
                  <TableHead className="w-[120px]">Placa</TableHead>
                  <TableHead>Modelo / Marca</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Setor / Secretaria</TableHead>
                  <TableHead>Hodômetro</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-bold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{v.fleetCode}</span>
                        {v.isPilot && (
                          <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md tracking-wider">
                            PILOTO
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold bg-muted/60 px-2 py-1 rounded-lg border border-border/40">
                        {v.plate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{v.model}</span>
                        <span className="text-xs text-muted-foreground">{v.brand} • {v.year}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-foreground/80">
                        {categoryLabels[v.category] || v.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {v.department || "Não informado"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      {formatOdometer(v.currentOdometer)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={criticalityVariants[v.criticality] || "neutral"}>
                        {v.criticality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[v.status] || "neutral"}>
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/${params.tenantSlug}/veiculos/${v.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInactivate(v.id, v.fleetCode)}
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                          title="Inativar veículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination Bar */}
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
    </div>
  );
}
