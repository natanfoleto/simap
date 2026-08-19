import { Prisma, OdometerSource } from "@prisma/client";
import { prisma } from "../prisma";
import { recordAuditLog } from "../audit";

export interface OdometerValidationResult {
  valid: boolean;
  errorCode?: string;
  message?: string;
}

/**
 * Valida a nova leitura de hodômetro em relação à leitura atual
 */
export function validateOdometerReading(
  currentKm: number,
  newReading: number,
  isCorrection = false,
  correctionReason?: string | null
): OdometerValidationResult {
  if (newReading < 0) {
    return {
      valid: false,
      errorCode: "INVALID_ODOMETER",
      message: "A quilometragem não pode ser um valor negativo.",
    };
  }

  if (newReading < currentKm) {
    if (!isCorrection) {
      return {
        valid: false,
        errorCode: "ODOMETER_REGRESSION",
        message: `A quilometragem informada (${newReading.toLocaleString("pt-BR")} km) não pode ser inferior ao último registro (${currentKm.toLocaleString("pt-BR")} km) sem autorização de correção.`,
      };
    }

    if (!correctionReason || correctionReason.trim().length < 5) {
      return {
        valid: false,
        errorCode: "MISSING_CORRECTION_REASON",
        message: "Para realizar uma correção regressiva de hodômetro, é obrigatório fornecer uma justificativa detalhada.",
      };
    }
  }

  return { valid: true };
}

export interface RegisterOdometerParams {
  tenantId: string;
  vehicleId: string;
  userId?: string | null;
  reading: number;
  readingDate?: Date;
  source?: OdometerSource;
  isCorrection?: boolean;
  correctionReason?: string | null;
  notes?: string | null;
}

/**
 * Registra leitura de hodômetro de forma atômica no banco, atualizando o veículo e trilha de auditoria
 */
export async function registerOdometerReadingTx(
  params: RegisterOdometerParams,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  const vehicle = await client.vehicle.findUnique({
    where: { id: params.vehicleId },
  });

  if (!vehicle) {
    throw new Error("Veículo não encontrado.");
  }

  const validation = validateOdometerReading(
    vehicle.currentOdometer,
    params.reading,
    params.isCorrection,
    params.correctionReason
  );

  if (!validation.valid) {
    const error = new Error(validation.message);
    (error as unknown as { errorCode: string }).errorCode = validation.errorCode || "VALIDATION_ERROR";
    throw error;
  }

  // 1. Grava a leitura de hodômetro
  const reading = await client.odometerReading.create({
    data: {
      tenantId: params.tenantId,
      vehicleId: params.vehicleId,
      userId: params.userId || null,
      reading: params.reading,
      readingDate: params.readingDate || new Date(),
      source: params.source || OdometerSource.MANUAL,
      isCorrection: params.isCorrection || false,
      correctionReason: params.correctionReason || null,
      notes: params.notes || null,
    },
  });

  // 2. Atualiza o hodômetro atual do veículo
  const updatedVehicle = await client.vehicle.update({
    where: { id: params.vehicleId },
    data: {
      currentOdometer: params.reading,
    },
  });

  // 3. Se for correção regressiva ou manual, registra auditoria
  if (params.isCorrection || params.source === OdometerSource.MANUAL) {
    await recordAuditLog(
      {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.isCorrection ? "CORRECAO_HODOMETRO" : "REGISTRO_HODOMETRO",
        entity: "OdometerReading",
        entityId: reading.id,
        oldValues: { currentOdometer: vehicle.currentOdometer },
        newValues: {
          newOdometer: params.reading,
          source: params.source,
          reason: params.correctionReason,
        },
      },
      client
    );
  }

  return { reading, vehicle: updatedVehicle };
}
