import { describe, it, expect } from "vitest";
import { formatUTCDate, formatBRL, formatOdometer, formatPercentage } from "@/lib/formatters";

describe("Formatadores e Regras de Apresentação", () => {
  it("formatUTCDate deve formatar corretamente datas sem retroceder o dia em UTC-3", () => {
    // 2025-01-31T00:00:00.000Z
    const dateStr = "2025-01-31T00:00:00.000Z";
    const formatted = formatUTCDate(dateStr);
    expect(formatted).toBe("31/01/2025");
  });

  it("formatUTCDate deve retornar traço para valores nulos ou inválidos", () => {
    expect(formatUTCDate(null)).toBe("—");
    expect(formatUTCDate(undefined)).toBe("—");
    expect(formatUTCDate("invalid-date")).toBe("—");
  });

  it("formatBRL deve formatar valores em Reais (R$)", () => {
    expect(formatBRL(285000)).toMatch(/285\.000,00/);
    expect(formatBRL(57000.5)).toMatch(/57\.000,50/);
    expect(formatBRL(0)).toMatch(/0,00/);
  });

  it("formatOdometer deve formatar quilometragem", () => {
    expect(formatOdometer(125400)).toMatch(/125\.400 km/);
    expect(formatOdometer(0)).toMatch(/0 km/);
    expect(formatOdometer(null)).toMatch(/0 km/);
  });

  it("formatPercentage deve formatar percentuais com precisão", () => {
    expect(formatPercentage(20)).toBe("20,0%");
    expect(formatPercentage(33.333, 2)).toBe("33,33%");
    expect(formatPercentage(0)).toBe("0,0%");
  });
});
