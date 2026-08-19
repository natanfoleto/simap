import { NextRequest } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { vehicleCsvRowSchema } from "@/lib/validations";
import { recordAuditLog } from "@/lib/audit";
import {
  apiSuccess,
  apiFailure,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import Papa from "papaparse";
import { VehicleCategory, Criticality, VehicleStatus } from "@prisma/client";

export interface CsvRowError {
  line: number;
  codigo_frota?: string;
  placa?: string;
  message: string;
  rawRow: Record<string, string>;
}

export interface ValidatedVehicleRow {
  line: number;
  fleetCode: string;
  plate: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  purpose: string;
  department: string | null;
  criticality: Criticality;
  status: VehicleStatus;
  notes: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "importar", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) return forbiddenResponse("Tenant obrigatório.");

    const body = await req.json().catch(() => null);
    if (!body) return validationErrorResponse("Corpo da requisição ausente.");

    const { action, csvContent, confirmedVehicles } = body;

    // ETAPA 1: PREVIEW E VALIDAÇÃO
    if (action === "preview") {
      if (!csvContent || typeof csvContent !== "string") {
        return validationErrorResponse("Conteúdo CSV ausente ou inválido.");
      }

      const parseResult = Papa.parse<Record<string, string>>(csvContent.trim(), {
        header: true,
        skipEmptyLines: "greedy",
      });

      if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
        return apiFailure(
          "Erro na estrutura do arquivo CSV. Verifique se o formato está correto.",
          "CSV_PARSE_ERROR",
          400,
          parseResult.errors
        );
      }

      const rows = parseResult.data;
      const errors: CsvRowError[] = [];
      const validRows: ValidatedVehicleRow[] = [];
      const seenPlatesInCsv = new Set<string>();
      const seenFleetCodesInCsv = new Set<string>();

      // Buscar placas e códigos já existentes no tenant
      const existingVehicles = await prisma.vehicle.findMany({
        where: { tenantId },
        select: { plate: true, fleetCode: true },
      });

      const existingPlatesDb = new Set(existingVehicles.map((v) => v.plate.toUpperCase()));
      const existingFleetCodesDb = new Set(existingVehicles.map((v) => v.fleetCode.toUpperCase()));

      for (let i = 0; i < rows.length; i++) {
        const lineNum = i + 2; // +1 cabeçalho, +1 index base 1
        const raw = rows[i];

        // Normalização de chaves caso haja espaços
        const normalizedRow: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
          normalizedRow[k.trim().toLowerCase()] = v ? v.trim() : "";
        }

        const parsed = vehicleCsvRowSchema.safeParse(normalizedRow);

        if (!parsed.success) {
          const firstError = parsed.error.errors[0]?.message || "Dados inválidos na linha";
          errors.push({
            line: lineNum,
            codigo_frota: normalizedRow.codigo_frota,
            placa: normalizedRow.placa,
            message: firstError,
            rawRow: raw,
          });
          continue;
        }

        const data = parsed.data;
        const plateClean = data.placa.replace(/[^A-Z0-9]/g, "").toUpperCase();
        const fleetCodeClean = data.codigo_frota.toUpperCase();

        // Checagem de duplicação dentro da própria planilha
        if (seenPlatesInCsv.has(plateClean)) {
          errors.push({
            line: lineNum,
            codigo_frota: fleetCodeClean,
            placa: plateClean,
            message: `Placa duplicada na própria planilha (linha ${lineNum})`,
            rawRow: raw,
          });
          continue;
        }

        if (seenFleetCodesInCsv.has(fleetCodeClean)) {
          errors.push({
            line: lineNum,
            codigo_frota: fleetCodeClean,
            placa: plateClean,
            message: `Código de frota duplicado na própria planilha (linha ${lineNum})`,
            rawRow: raw,
          });
          continue;
        }

        // Checagem de duplicação com o banco de dados
        if (existingPlatesDb.has(plateClean)) {
          errors.push({
            line: lineNum,
            codigo_frota: fleetCodeClean,
            placa: plateClean,
            message: `Placa ${plateClean} já cadastrada anteriormente no município`,
            rawRow: raw,
          });
          continue;
        }

        if (existingFleetCodesDb.has(fleetCodeClean)) {
          errors.push({
            line: lineNum,
            codigo_frota: fleetCodeClean,
            placa: plateClean,
            message: `Código de frota ${fleetCodeClean} já cadastrado anteriormente no município`,
            rawRow: raw,
          });
          continue;
        }

        seenPlatesInCsv.add(plateClean);
        seenFleetCodesInCsv.add(fleetCodeClean);

        validRows.push({
          line: lineNum,
          fleetCode: fleetCodeClean,
          plate: plateClean,
          category: data.categoria as VehicleCategory,
          brand: data.marca,
          model: data.modelo,
          year: data.ano,
          fuelType: data.combustivel,
          purpose: data.finalidade,
          department: data.setor || null,
          criticality: (data.criticidade || "MEDIA") as Criticality,
          status: (data.status || "ATIVO") as VehicleStatus,
          notes: data.observacoes || null,
        });
      }

      return apiSuccess({
        totalLines: rows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        validRows,
        errors,
      });
    }

    // ETAPA 2: COMMIT TRANSACIONAL
    if (action === "commit") {
      if (!Array.isArray(confirmedVehicles) || confirmedVehicles.length === 0) {
        return validationErrorResponse("Nenhum veículo válido enviado para confirmação.");
      }

      const createdVehicles = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const item of confirmedVehicles as ValidatedVehicleRow[]) {
          const created = await tx.vehicle.create({
            data: {
              tenantId,
              fleetCode: item.fleetCode,
              plate: item.plate,
              category: item.category,
              brand: item.brand,
              model: item.model,
              year: item.year,
              fuelType: item.fuelType,
              purpose: item.purpose,
              department: item.department,
              criticality: item.criticality,
              status: item.status,
              currentOdometer: 0,
              isPilot: false,
              active: true,
              notes: item.notes,
            },
          });
          results.push(created);
        }

        await recordAuditLog(
          {
            tenantId,
            userId: session.user.id,
            action: "IMPORTAR_VEICULOS_CSV",
            entity: "Vehicle",
            entityId: tenantId,
            newValues: {
              importedCount: results.length,
              vehicles: results.map((v) => ({ id: v.id, plate: v.plate, fleetCode: v.fleetCode })),
            },
          },
          tx
        );

        return results;
      });

      return apiSuccess(
        { count: createdVehicles.length },
        `${createdVehicles.length} veículos importados com sucesso!`
      );
    }

    return validationErrorResponse("Ação inválida. Use 'preview' ou 'commit'.");
  } catch (error) {
    console.error("POST /api/vehicles/import error:", error);
    return internalErrorResponse();
  }
}
