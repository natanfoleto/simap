"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePreventivePlans } from "@/hooks/use-preventive-plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  Plus,
  Truck,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function PreventivePlansPage({ params }: { params: { tenantSlug: string } }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { data: plans, isLoading } = usePreventivePlans(selectedCategory || undefined);

  const categories = [
    { value: "", label: "Todas as Categorias" },
    { value: "ONIBUS", label: "Ônibus" },
    { value: "AMBULANCIA", label: "Ambulâncias" },
    { value: "CARRO", label: "Carros Leves" },
    { value: "VAN", label: "Vans" },
    { value: "CAMINHAO", label: "Caminhões" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Planos de Manutenção Preventiva
            </h1>
            <Badge variant="success" className="text-xs">
              Ativo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Periodicidades, tolerâncias e itens de intervenção preventiva por categoria de frota
          </p>
        </div>

        <Link href={`/${params.tenantSlug}/planos-preventivos/novo`}>
          <Button className="rounded-2xl gap-2 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" />
            Novo Plano Preventivo
          </Button>
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c.value}
            variant={selectedCategory === c.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(c.value)}
            className="rounded-xl text-xs"
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : !plans || plans.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border-border/40 bg-card/30 space-y-3">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold">Nenhum plano encontrado</h3>
          <p className="text-xs text-muted-foreground">
            Cadastre um novo plano ou selecione outra categoria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan: {
            id: string;
            name: string;
            category: string;
            description?: string;
            version: number;
            items: Array<{
              id: string;
              name: string;
              intervalKm?: number;
              intervalDays?: number;
              priority: string;
            }>;
            _count?: { assignedVehicles: number };
          }) => (
            <Card
              key={plan.id}
              className="flex flex-col justify-between rounded-3xl border-border/40 bg-card/40 backdrop-blur-md transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <CardHeader className="p-6 pb-4 border-b border-border/30">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="default" className="text-[10px] uppercase font-bold">
                    {plan.category}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Versão {plan.version}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {plan.description || "Plano oficial de manutenção preventiva."}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/20 pb-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    {plan.items.length} itens de serviço
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    {plan._count?.assignedVehicles || 0} veículos vinculados
                  </span>
                </div>

                {/* Resumo dos Itens */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Principais Procedimentos:
                  </span>
                  <ul className="space-y-1 text-xs text-foreground/80">
                    {plan.items.slice(0, 3).map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-[11px] bg-muted/30 px-2.5 py-1.5 rounded-lg">
                        <span className="truncate max-w-[180px]">{item.name}</span>
                        <span className="text-muted-foreground text-[10px] shrink-0">
                          {item.intervalKm ? `${item.intervalKm.toLocaleString("pt-BR")} km` : `${item.intervalDays} dias`}
                        </span>
                      </li>
                    ))}
                    {plan.items.length > 3 && (
                      <li className="text-[10px] text-muted-foreground text-center pt-0.5">
                        + {plan.items.length - 3} outros itens no plano
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>

              <div className="p-4 pt-0">
                <Link href={`/${params.tenantSlug}/planos-preventivos/${plan.id}`}>
                  <Button variant="outline" className="w-full rounded-xl gap-2 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    Ver Detalhes e Vincular
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
