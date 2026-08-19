import { describe, it, expect } from "vitest";
import { calculateMaintenanceDueStatus } from "@/lib/domain/maintenance-due";

describe("Motor de Cálculo de Vencimento Preventivo (Regra do Primeiro Limite)", () => {
  const currentDate = new Date("2026-08-19T12:00:00.000Z");

  it("deve retornar SEM_DADOS quando o item não tem regras de intervalo", () => {
    const res = calculateMaintenanceDueStatus(
      { name: "Item sem regras", intervalKm: null, intervalDays: null },
      null,
      null,
      50000,
      currentDate
    );
    expect(res.status).toBe("SEM_DADOS");
  });

  it("deve calcular status EM_DIA quando quilometragem e data estão longe do vencimento", () => {
    const res = calculateMaintenanceDueStatus(
      {
        name: "Troca de Óleo",
        intervalKm: 10000,
        intervalDays: 180,
        toleranceKm: 500,
        toleranceDays: 15,
      },
      50000, // última troca aos 50.000 km
      "2026-06-01T00:00:00.000Z", // há ~80 dias
      55000, // atual 55.000 km (faltam 5.000 km)
      currentDate
    );

    expect(res.status).toBe("EM_DIA");
    expect(res.nextDueKm).toBe(60000);
    expect(res.remainingKm).toBe(5000);
  });

  it("deve calcular status PROXIMA quando a quilometragem entra na faixa de tolerância", () => {
    const res = calculateMaintenanceDueStatus(
      {
        name: "Troca de Óleo",
        intervalKm: 10000,
        intervalDays: 180,
        toleranceKm: 500,
        toleranceDays: 15,
      },
      50000, // próxima aos 60.000 km
      "2026-06-01T00:00:00.000Z",
      59600, // faltam 400 km (<= tolerância de 500 km)
      currentDate
    );

    expect(res.status).toBe("PROXIMA");
    expect(res.dueReason).toBe("KM");
  });

  it("deve calcular status VENCIDA quando atinge a quilometragem antes do tempo", () => {
    const res = calculateMaintenanceDueStatus(
      {
        name: "Troca de Óleo",
        intervalKm: 10000,
        intervalDays: 180,
      },
      50000, // próxima aos 60.000 km
      "2026-07-01T00:00:00.000Z", // data ainda dentro do prazo
      60200, // hodômetro passou em 200 km
      currentDate
    );

    expect(res.status).toBe("VENCIDA");
    expect(res.dueReason).toBe("KM");
  });

  it("deve calcular status VENCIDA quando atinge o prazo em dias antes da quilometragem", () => {
    const res = calculateMaintenanceDueStatus(
      {
        name: "Troca de Óleo",
        intervalKm: 10000,
        intervalDays: 90, // 90 dias
      },
      50000, // hodômetro só andou 2.000 km
      "2026-01-01T00:00:00.000Z", // mais de 200 dias atrás
      52000,
      currentDate
    );

    expect(res.status).toBe("VENCIDA");
    expect(res.dueReason).toBe("TEMPO");
  });

  it("deve calcular status VENCIDA por AMBOS os critérios", () => {
    const res = calculateMaintenanceDueStatus(
      {
        name: "Troca de Óleo",
        intervalKm: 10000,
        intervalDays: 90,
      },
      50000,
      "2026-01-01T00:00:00.000Z", // vencido por tempo
      61000, // vencido por km
      currentDate
    );

    expect(res.status).toBe("VENCIDA");
    expect(res.dueReason).toBe("AMBOS");
  });
});
