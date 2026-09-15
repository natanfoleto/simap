"use client";

import React from "react";
import Link from "next/link";
import { useInconsistencies } from "@/hooks/use-financial";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatUTCDate } from "@/lib/formatters";
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Gauge,
  Clock,
  CalendarCheck,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";

export default function InconsistenciesPage({ params }: { params: { tenantSlug: string } }) {
  const { data, isLoading } = useInconsistencies();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  const counts = data?.counts || {
    total: 0,
    ordersWithoutCost: 0,
    vehiclesWithoutRecentReading: 0,
    openDowntimes: 0,
    vehiclesWithoutPlan: 0,
  };

  const details = data?.details || {
    ordersWithoutCost: [],
    vehiclesWithoutRecentReading: [],
    openDowntimes: [],
    vehiclesWithoutPlan: [],
  };

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${params.tenantSlug}/financeiro`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Painel Financeiro
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Diagnóstico de Inconsistências & Qualidade
            </h1>
            <Badge
              variant={counts.total > 0 ? "outline" : "default"}
              className={counts.total > 0 ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-xs font-bold" : "bg-emerald-600 text-xs"}
            >
              {counts.total} pendência{counts.total === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Auditoria operacional contínua para prevenir falhas de cobertura e garantir fidedignidade analítica
          </p>
        </div>
      </div>

      {/* 2. Grid de Resumo dos 4 Eixos de Qualidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* OS sem Custos */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OS sem Custo</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <FileWarning className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{counts.ordersWithoutCost}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Concluídas com valor zero ou sem discriminação de peças
            </p>
          </CardContent>
        </Card>

        {/* Sem Odômetro Recente */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sem Leitura Recente</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Gauge className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{counts.vehiclesWithoutRecentReading}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Veículos ativos há mais de 30 dias sem leitura de hodômetro
            </p>
          </CardContent>
        </Card>

        {/* Paradas em Aberto */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paradas em Aberto</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{counts.openDowntimes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Indisponibilidades registradas sem data de término
            </p>
          </CardContent>
        </Card>

        {/* Sem Plano Preventivo */}
        <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between border-none">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sem Plano Preventivo</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="text-2xl font-black text-foreground">{counts.vehiclesWithoutPlan}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Veículos ativos que ainda não foram vinculados a um plano
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Abas Detalhadas */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="orders" className="gap-2">
            Ordens sem Custo ({counts.ordersWithoutCost})
          </TabsTrigger>
          <TabsTrigger value="odometer" className="gap-2">
            Sem Leitura de Km ({counts.vehiclesWithoutRecentReading})
          </TabsTrigger>
          <TabsTrigger value="downtime" className="gap-2">
            Paradas em Aberto ({counts.openDowntimes})
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            Sem Plano ({counts.vehiclesWithoutPlan})
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Ordens sem Custo */}
        <TabsContent value="orders">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold">Ordens de Serviço Concluídas sem Custos Detalhados</CardTitle>
              <CardDescription className="text-xs">
                A fidedignidade financeira requer que toda OS concluída possua o custo de peças e/ou serviços discriminado.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {details.ordersWithoutCost.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 border-y border-border/30 text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-5">Número da OS</th>
                        <th className="py-3 px-4">Veículo</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Descrição do Serviço</th>
                        <th className="py-3 px-4">Conclusão</th>
                        <th className="py-3 px-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {details.ordersWithoutCost.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-5 font-bold font-mono text-foreground">{order.orderNumber}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">{order.vehicle.fleetCode}</span>
                            <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">({order.vehicle.plate})</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px]">
                              {order.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground truncate max-w-[280px]">{order.description}</td>
                          <td className="py-3 px-4 text-muted-foreground">{formatUTCDate(order.completedAt)}</td>
                          <td className="py-3 px-4 text-center">
                            <Link href={`/${params.tenantSlug}/ordens-servico/${order.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-xl text-primary gap-1">
                                Lançar Custos
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">Excelente conformidade financeira!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Todas as ordens concluídas possuem detalhamento de peças e serviços.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Sem Odômetro Recente */}
        <TabsContent value="odometer">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold">Veículos sem Leitura Recente de Hodômetro</CardTitle>
              <CardDescription className="text-xs">
                Veículos ativos que não tiveram medição de quilometragem nos últimos 30 dias, inviabilizando o cálculo seguro de custo por km.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {details.vehiclesWithoutRecentReading.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 border-y border-border/30 text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-5">Veículo</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4">Departamento</th>
                        <th className="py-3 px-4 text-right">Último Km Registrado</th>
                        <th className="py-3 px-4">Data da Última Leitura</th>
                        <th className="py-3 px-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {details.vehiclesWithoutRecentReading.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-5 font-semibold text-foreground">
                            <span>{v.fleetCode}</span>
                            <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">({v.plate})</span>
                          </td>
                          <td className="py-3 px-4">{v.category}</td>
                          <td className="py-3 px-4 text-muted-foreground">{v.department}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {v.lastReading.toLocaleString("pt-BR")} km
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-mono">
                            {v.lastReadingDate ? formatUTCDate(v.lastReadingDate) : "Nunca registrado"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link href={`/${params.tenantSlug}/quilometragem`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-xl text-primary gap-1">
                                Registrar Km
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">100% da frota ativa com odômetros atualizados!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Todos os veículos possuem registros regulares nos últimos 30 dias.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Paradas em Aberto */}
        <TabsContent value="downtime">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold">Registros de Indisponibilidade em Aberto</CardTitle>
              <CardDescription className="text-xs">
                Veículos com tempo de parada iniciado mas sem encerramento registrado, impactando a taxa de disponibilidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {details.openDowntimes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 border-y border-border/30 text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-5">Veículo</th>
                        <th className="py-3 px-4">Motivo da Parada</th>
                        <th className="py-3 px-4">Início da Indisponibilidade</th>
                        <th className="py-3 px-4">OS Vinculada</th>
                        <th className="py-3 px-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {details.openDowntimes.map((down) => (
                        <tr key={down.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-5 font-semibold text-foreground">
                            <span>{down.vehicle.fleetCode}</span>
                            <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">({down.vehicle.plate})</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">{down.reason}</td>
                          <td className="py-3 px-4 text-muted-foreground font-mono">{formatUTCDate(down.startDate)}</td>
                          <td className="py-3 px-4">
                            {down.order ? (
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {down.order.orderNumber}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {down.order ? (
                              <Link href={`/${params.tenantSlug}/ordens-servico/${down.order.id}`}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-xl text-primary gap-1">
                                  Concluir OS
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            ) : (
                              <Link href={`/${params.tenantSlug}/veiculos/${down.vehicle.id}/timeline`}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-xl text-primary gap-1">
                                  Ver Timeline
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">Nenhuma parada pendente de encerramento.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Todas as indisponibilidades históricas foram devidamente finalizadas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 4: Sem Plano Preventivo */}
        <TabsContent value="plans">
          <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-base font-bold">Veículos Ativos sem Plano Preventivo Vinculado</CardTitle>
              <CardDescription className="text-xs">
                Veículos cadastrados que não possuem intervalos de revisão configurados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {details.vehiclesWithoutPlan.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/30 border-y border-border/30 text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-5">Veículo</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4">Departamento</th>
                        <th className="py-3 px-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {details.vehiclesWithoutPlan.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-5 font-semibold text-foreground">
                            <span>{v.fleetCode}</span>
                            <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">({v.plate})</span>
                          </td>
                          <td className="py-3 px-4">{v.category}</td>
                          <td className="py-3 px-4 text-muted-foreground">{v.department || "Não informado"}</td>
                          <td className="py-3 px-4 text-center">
                            <Link href={`/${params.tenantSlug}/planos-preventivos`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs rounded-xl text-primary gap-1">
                                Vincular Plano
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-foreground">Cobertura preventiva de 100%!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Todos os veículos da frota ativa possuem plano preventivo por categoria vinculado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
