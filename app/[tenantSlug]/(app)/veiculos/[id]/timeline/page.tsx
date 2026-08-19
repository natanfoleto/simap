"use client";

import React from "react";
import Link from "next/link";
import { useVehicleTimeline } from "@/hooks/use-timeline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatOdometer } from "@/lib/formatters";
import {
  History,
  ArrowLeft,
  Gauge,
  ClipboardCheck,
  Wrench,
  AlertOctagon,
  ShieldAlert,
  Clock,
  Truck,
} from "lucide-react";

export default function VehicleTimelinePage({
  params,
}: {
  params: { tenantSlug: string; id: string };
}) {
  const { data, isLoading } = useVehicleTimeline(params.id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!data?.vehicle) {
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

  const { vehicle, events } = data;

  const eventIcons = {
    ODOMETER: Gauge,
    CHECKLIST: ClipboardCheck,
    MAINTENANCE_ORDER: Wrench,
    DOWNTIME: AlertOctagon,
    AUDIT: History,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${params.tenantSlug}/veiculos/${vehicle.id}`}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Linha do Tempo: {vehicle.fleetCode}
              </h1>
              <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-lg">
                {vehicle.plate}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {vehicle.model} • Hodômetro Atual: {formatOdometer(vehicle.currentOdometer)}
            </p>
          </div>
        </div>

        <Link href={`/${params.tenantSlug}/veiculos/${vehicle.id}`}>
          <Button variant="outline" className="rounded-2xl text-xs">
            Ver Ficha do Veículo
          </Button>
        </Link>
      </div>

      {/* Timeline Card */}
      <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico Integrado de Operação e Manutenção
          </CardTitle>
          <CardDescription className="text-xs">
            Registro unificado de hodômetro, checklists, ordens de serviço e indisponibilidades
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {events.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold">Nenhum evento registrado ainda para este veículo.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-border/60 space-y-8 ml-4">
              {events.map((ev) => {
                const Icon = eventIcons[ev.type] || History;
                return (
                  <div key={ev.id} className="relative group">
                    {/* Dot */}
                    <div className={`absolute -left-[33px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background shadow-sm ${
                      ev.severity === "CRITICAL"
                        ? "bg-destructive text-white"
                        : ev.severity === "WARNING"
                        ? "bg-amber-500 text-white"
                        : ev.severity === "SUCCESS"
                        ? "bg-emerald-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      <Icon className="h-3 w-3" />
                    </div>

                    {/* Content Box */}
                    <div className="p-4 rounded-2xl bg-card/60 border border-border/40 hover:border-primary/40 transition-all space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-foreground">{ev.title}</h4>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDateTime(ev.date)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
