import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata datas sem hora (evitando a redução de 1 dia decorrente de fusos como UTC-3)
 */
export function formatUTCDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}

/**
 * Formata data e hora completas para exibição operacional (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";

  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/**
 * Formatação padronizada de moeda brasileira (R$)
 */
export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Formatação de hodômetro e quilometragem
 */
export function formatOdometer(km: number | string | null | undefined): string {
  if (km === null || km === undefined || km === "") return "0 km";
  const num = typeof km === "string" ? parseInt(km, 10) : km;
  if (isNaN(num)) return "0 km";

  return `${new Intl.NumberFormat("pt-BR").format(num)} km`;
}

/**
 * Formata percentual com 1 ou 2 casas decimais
 */
export function formatPercentage(value: number | string | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || value === "") return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";

  return `${num.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}
