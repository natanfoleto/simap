import { describe, it, expect } from "vitest";
import { vehicleCsvRowSchema } from "@/lib/validations";

describe("Validação de Linhas de CSV de Veículos", () => {
  it("deve aceitar linha válida completa", () => {
    const validRow = {
      codigo_frota: "ONB-01",
      placa: "ABC1D23",
      categoria: "ONIBUS",
      marca: "Mercedes-Benz",
      modelo: "OF-1721",
      ano: 2021,
      combustivel: "DIESEL",
      finalidade: "Transporte Escolar",
      setor: "Educacao",
      criticidade: "ALTA",
      status: "ATIVO",
      observacoes: "Ônibus rural",
    };

    const result = vehicleCsvRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it("deve rejeitar categoria inexistente", () => {
    const invalidRow = {
      codigo_frota: "ONB-01",
      placa: "ABC1D23",
      categoria: "SUBMARINO",
      marca: "Mercedes-Benz",
      modelo: "OF-1721",
      ano: 2021,
      combustivel: "DIESEL",
      finalidade: "Transporte Escolar",
    };

    const result = vehicleCsvRowSchema.safeParse(invalidRow);
    expect(result.success).toBe(false);
  });

  it("deve rejeitar linha sem placa ou sem código de frota", () => {
    const invalidRow = {
      codigo_frota: "",
      placa: "",
      categoria: "CARRO",
      marca: "Fiat",
      modelo: "Mobi",
      ano: 2022,
      combustivel: "FLEX",
      finalidade: "Gabinete",
    };

    const result = vehicleCsvRowSchema.safeParse(invalidRow);
    expect(result.success).toBe(false);
  });

  it("deve aceitar anos numéricos válidos", () => {
    const validRow = {
      codigo_frota: "CAR-02",
      placa: "DEF4E56",
      categoria: "CARRO",
      marca: "Fiat",
      modelo: "Uno",
      ano: "2015", // string coercible
      combustivel: "FLEX",
      finalidade: "Serviço Geral",
    };

    const result = vehicleCsvRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });
});
