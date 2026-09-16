import { describe, it, expect } from "vitest";
import {
  calculateCostPerKm,
  mergeOverlappingIntervals,
  calculateFleetDowntimeAndAvailability,
  calculatePreventiveCompliance,
  evaluateDataQuality,
  generateFleetFinancialInsights,
} from "@/lib/domain/financial-indicators";

describe("Regras de Domínio e Indicadores Financeiros (Roadmap R2)", () => {
  describe("calculateCostPerKm (Custo por Km Rodado)", () => {
    it("deve calcular o custo por km corretamente com valores válidos", () => {
      // R$ 1.500,00 gastos para 3.000 km rodados = R$ 0,50/km
      const result = calculateCostPerKm(1500, 3000);
      expect(result).toBe(0.5);
    });

    it("deve retornar null quando a quilometragem for zero (evita divisão por zero)", () => {
      const result = calculateCostPerKm(1200, 0);
      expect(result).toBeNull();
    });

    it("deve retornar null quando a quilometragem for nula ou indefinida (evita zero artificial)", () => {
      expect(calculateCostPerKm(500, null)).toBeNull();
      expect(calculateCostPerKm(500, undefined)).toBeNull();
    });

    it("deve retornar null quando a quilometragem for negativa", () => {
      expect(calculateCostPerKm(500, -100)).toBeNull();
    });

    it("deve retornar 0 quando o custo for 0 e houver quilometragem rodada", () => {
      expect(calculateCostPerKm(0, 1000)).toBe(0);
    });

    it("deve arredondar para até 4 casas decimais com precisão", () => {
      // 1000 / 3000 = 0.3333...
      expect(calculateCostPerKm(1000, 3000)).toBe(0.3333);
    });
  });

  describe("mergeOverlappingIntervals (Fusão de Intervalos Sobrepostos)", () => {
    it("deve manter intervalos intactos se forem disjuntos", () => {
      const intervals = [
        { start: new Date("2026-03-01T08:00:00Z"), end: new Date("2026-03-01T12:00:00Z") },
        { start: new Date("2026-03-01T14:00:00Z"), end: new Date("2026-03-01T18:00:00Z") },
      ];
      const merged = mergeOverlappingIntervals(intervals);
      expect(merged).toHaveLength(2);
      expect(merged[0].start).toEqual(intervals[0].start);
      expect(merged[0].end).toEqual(intervals[0].end);
    });

    it("deve fundir intervalos que se sobrepõem parcialmente", () => {
      const intervals = [
        { start: new Date("2026-03-01T08:00:00Z"), end: new Date("2026-03-01T12:00:00Z") },
        { start: new Date("2026-03-01T10:00:00Z"), end: new Date("2026-03-01T14:00:00Z") },
      ];
      const merged = mergeOverlappingIntervals(intervals);
      expect(merged).toHaveLength(1);
      expect(merged[0].start).toEqual(new Date("2026-03-01T08:00:00Z"));
      expect(merged[0].end).toEqual(new Date("2026-03-01T14:00:00Z"));
    });

    it("deve fundir intervalos contíguos (onde o fim de um é o início de outro)", () => {
      const intervals = [
        { start: new Date("2026-03-01T08:00:00Z"), end: new Date("2026-03-01T12:00:00Z") },
        { start: new Date("2026-03-01T12:00:00Z"), end: new Date("2026-03-01T16:00:00Z") },
      ];
      const merged = mergeOverlappingIntervals(intervals);
      expect(merged).toHaveLength(1);
      expect(merged[0].start).toEqual(new Date("2026-03-01T08:00:00Z"));
      expect(merged[0].end).toEqual(new Date("2026-03-01T16:00:00Z"));
    });

    it("deve absorver intervalos totalmente contidos dentro de outro", () => {
      const intervals = [
        { start: new Date("2026-03-01T08:00:00Z"), end: new Date("2026-03-01T18:00:00Z") },
        { start: new Date("2026-03-01T10:00:00Z"), end: new Date("2026-03-01T12:00:00Z") },
      ];
      const merged = mergeOverlappingIntervals(intervals);
      expect(merged).toHaveLength(1);
      expect(merged[0].start).toEqual(new Date("2026-03-01T08:00:00Z"));
      expect(merged[0].end).toEqual(new Date("2026-03-01T18:00:00Z"));
    });
  });

  describe("calculateFleetDowntimeAndAvailability (Disponibilidade sem Dupla Contagem)", () => {
    it("deve retornar 100% de disponibilidade quando não há registros de parada", () => {
      const result = calculateFleetDowntimeAndAvailability({
        records: [],
        periodStart: new Date("2026-03-01T00:00:00Z"),
        periodEnd: new Date("2026-03-02T00:00:00Z"), // 24 horas
        totalActiveVehicles: 10,
      });

      expect(result.totalDowntimeHours).toBe(0);
      expect(result.totalFleetHours).toBe(240); // 10 veículos * 24h
      expect(result.availabilityPercentage).toBe(100);
    });

    it("não deve contar paradas sobrepostas do mesmo veículo duas vezes", () => {
      // Veículo V1 com duas ordens com paradas simultâneas (ex: OS mecânica das 08h às 12h e OS elétrica das 10h às 14h)
      // Período total de parada de V1 deve ser de 6 horas (08h às 14h), não 8 horas.
      const records = [
        {
          vehicleId: "V1",
          start: new Date("2026-03-01T08:00:00Z"),
          end: new Date("2026-03-01T12:00:00Z"), // 4h
        },
        {
          vehicleId: "V1",
          start: new Date("2026-03-01T10:00:00Z"),
          end: new Date("2026-03-01T14:00:00Z"), // 4h (com sobreposição de 2h)
        },
      ];

      const result = calculateFleetDowntimeAndAvailability({
        records,
        periodStart: new Date("2026-03-01T00:00:00Z"),
        periodEnd: new Date("2026-03-01T24:00:00Z"), // 24h
        totalActiveVehicles: 1, // Apenas 1 veículo ativo
      });

      expect(result.totalDowntimeHours).toBe(6);
      expect(result.totalFleetHours).toBe(24);
      // Disponibilidade: (24 - 6) / 24 = 18 / 24 = 75%
      expect(result.availabilityPercentage).toBe(75);
    });

    it("deve somar horas de parada de veículos distintos quando ocorrem no mesmo período", () => {
      // V1 parado das 10h às 12h (2h) e V2 parado das 10h às 12h (2h)
      // Total de horas-veículo de indisponibilidade da frota = 4h
      const records = [
        {
          vehicleId: "V1",
          start: new Date("2026-03-01T10:00:00Z"),
          end: new Date("2026-03-01T12:00:00Z"),
        },
        {
          vehicleId: "V2",
          start: new Date("2026-03-01T10:00:00Z"),
          end: new Date("2026-03-01T12:00:00Z"),
        },
      ];

      const result = calculateFleetDowntimeAndAvailability({
        records,
        periodStart: new Date("2026-03-01T00:00:00Z"),
        periodEnd: new Date("2026-03-01T24:00:00Z"),
        totalActiveVehicles: 2, // 2 veículos ativos -> 48h totais
      });

      expect(result.totalDowntimeHours).toBe(4);
      expect(result.totalFleetHours).toBe(48);
      // (48 - 4) / 48 = 44 / 48 = 91.67%
      expect(result.availabilityPercentage).toBe(91.67);
    });

    it("deve limitar o intervalo aos limites do período avaliado (clipping)", () => {
      // Parada que começou antes do início do mês e terminou no meio
      const records = [
        {
          vehicleId: "V1",
          start: new Date("2026-02-28T12:00:00Z"), // Antes do período
          end: new Date("2026-03-01T12:00:00Z"),   // 12h dentro do período
        },
      ];

      const result = calculateFleetDowntimeAndAvailability({
        records,
        periodStart: new Date("2026-03-01T00:00:00Z"),
        periodEnd: new Date("2026-03-01T24:00:00Z"),
        totalActiveVehicles: 1,
      });

      expect(result.totalDowntimeHours).toBe(12);
      expect(result.availabilityPercentage).toBe(50);
    });
  });

  describe("calculatePreventiveCompliance (Aderência do Plano Preventivo)", () => {
    it("deve retornar 100% se não houver preventivas devidas", () => {
      expect(calculatePreventiveCompliance(0, 0)).toBe(100);
    });

    it("deve calcular a proporção correta de preventivas realizadas no prazo", () => {
      expect(calculatePreventiveCompliance(8, 10)).toBe(80);
      expect(calculatePreventiveCompliance(1, 3)).toBe(33.3);
    });
  });

  describe("evaluateDataQuality (Qualidade dos Dados Operacionais)", () => {
    it("deve atribuir score 100 quando todos os dados estão preenchidos e não há pendências", () => {
      const evaluation = evaluateDataQuality({
        totalActiveVehicles: 10,
        vehiclesWithOdometerReading: 10,
        totalCompletedOrders: 5,
        ordersWithCompleteCosts: 5,
        openDowntimesWithoutEndDate: 0,
        vehiclesWithoutPreventivePlan: 0,
      });

      expect(evaluation.score).toBe(100);
      expect(evaluation.odometerCoveragePercentage).toBe(100);
      expect(evaluation.costCompletenessPercentage).toBe(100);
      expect(evaluation.pendingInconsistenciesCount).toBe(0);
    });

    it("deve penalizar o score quando houver baixa cobertura ou inconsistências em aberto", () => {
      const evaluation = evaluateDataQuality({
        totalActiveVehicles: 10,
        vehiclesWithOdometerReading: 5, // 50%
        totalCompletedOrders: 10,
        ordersWithCompleteCosts: 5,     // 50%
        openDowntimesWithoutEndDate: 2,
        vehiclesWithoutPreventivePlan: 1,
      });

      expect(evaluation.odometerCoveragePercentage).toBe(50);
      expect(evaluation.costCompletenessPercentage).toBe(50);
      expect(evaluation.score).toBeLessThan(50);
      expect(evaluation.pendingInconsistenciesCount).toBeGreaterThan(0);
    });
  });

  describe("generateFleetFinancialInsights (Primeiros Insights Analíticos)", () => {
    it("deve gerar insights positivos quando houver transição preventiva, alta disponibilidade e 100% de gastos", () => {
      const insights = generateFleetFinancialInsights({
        totalCost: 10000,
        preventiveCost: 7500, // 75%
        correctiveCost: 2500, // 25%
        preventiveOrdersCount: 8,
        correctiveOrdersCount: 2,
        totalOrdersCount: 10,
        costPerKm: 0.45,
        totalKmDriven: 22000,
        availabilityPercentage: 98.2,
        totalDowntimeHours: 12,
        dataQualityScore: 100,
        costCompletenessPercentage: 100,
        odometerCoveragePercentage: 100,
        pendingInconsistenciesCount: 0,
        topCategoryByCost: { category: "ONIBUS", cost: 5000, percentage: 50 },
      });

      expect(insights.length).toBeGreaterThanOrEqual(4);
      const transition = insights.find((i) => i.category === "TRANSITION");
      expect(transition?.severity).toBe("POSITIVE");
      expect(transition?.title).toContain("Inversão da Curva");

      const efficiency = insights.find((i) => i.category === "EFFICIENCY");
      expect(efficiency?.severity).toBe("POSITIVE");
      expect(efficiency?.metric).toContain("0.45");

      const quality = insights.find((i) => i.category === "DATA_QUALITY");
      expect(quality?.severity).toBe("POSITIVE");
      expect(quality?.title).toContain("100% dos Gastos Registrados");

      const budget = insights.find((i) => i.category === "BUDGET");
      expect(budget?.severity).toBe("INFO");
      expect(budget?.title).toContain("ONIBUS");
    });

    it("deve alertar adequadamente quando corretivas dominarem e dados forem incompletos", () => {
      const insights = generateFleetFinancialInsights({
        totalCost: 10000,
        preventiveCost: 2000,
        correctiveCost: 8000,
        preventiveOrdersCount: 2,
        correctiveOrdersCount: 8,
        totalOrdersCount: 10,
        costPerKm: null,
        totalKmDriven: 0,
        availabilityPercentage: 85.0,
        totalDowntimeHours: 80,
        dataQualityScore: 50,
        costCompletenessPercentage: 60,
        odometerCoveragePercentage: 40,
        pendingInconsistenciesCount: 4,
      });

      const transition = insights.find((i) => i.category === "TRANSITION");
      expect(transition?.severity).toBe("WARNING");

      const availability = insights.find((i) => i.category === "AVAILABILITY");
      expect(availability?.severity).toBe("WARNING");

      const quality = insights.find((i) => i.category === "DATA_QUALITY");
      expect(quality?.severity).toBe("WARNING");

      const efficiency = insights.find((i) => i.category === "EFFICIENCY");
      expect(efficiency?.metric).toBe("Sem dados suficientes");
    });
  });
});

