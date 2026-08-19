import { describe, it, expect } from "vitest";
import { validateOdometerReading } from "@/lib/domain/odometer";

describe("Regras de Domínio de Hodômetro e Quilometragem", () => {
  it("deve aprovar leitura progressiva normal (maior ou igual à atual)", () => {
    const res = validateOdometerReading(120000, 120500, false);
    expect(res.valid).toBe(true);
  });

  it("deve aprovar leitura igual à atual", () => {
    const res = validateOdometerReading(120000, 120000, false);
    expect(res.valid).toBe(true);
  });

  it("deve rejeitar valor negativo", () => {
    const res = validateOdometerReading(1000, -50, false);
    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe("INVALID_ODOMETER");
  });

  it("deve bloquear regressão de quilometragem sem flag de correção", () => {
    const res = validateOdometerReading(120000, 119500, false);
    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe("ODOMETER_REGRESSION");
  });

  it("deve bloquear correção regressiva se a justificativa for ausente ou curta", () => {
    const res = validateOdometerReading(120000, 119500, true, "   ");
    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe("MISSING_CORRECTION_REASON");
  });

  it("deve aprovar correção regressiva quando houver justificativa adequada", () => {
    const res = validateOdometerReading(
      120000,
      119500,
      true,
      "Erro de digitação do operador no turno anterior confirmado pela nota fiscal"
    );
    expect(res.valid).toBe(true);
  });
});
