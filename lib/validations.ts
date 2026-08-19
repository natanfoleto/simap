import { z } from "zod";

export const vehicleCategoryEnum = z.enum([
  "ONIBUS",
  "CARRO",
  "AMBULANCIA",
  "VAN",
  "CAMINHAO",
  "MOTOCICLETA",
  "MAQUINA",
  "OUTRO",
]);

export const vehicleStatusEnum = z.enum(["ATIVO", "MANUTENCAO", "INATIVO"]);
export const criticalityEnum = z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]);
export const roleEnum = z.enum(["ADMIN", "GESTOR", "OPERADOR", "MOTORISTA", "AUDITOR"]);
export const milestoneStatusEnum = z.enum(["VALIDADO", "EM_ANDAMENTO", "PENDENTE"]);

/**
 * Schema para criação e atualização de Veículo
 */
export const vehicleSchema = z.object({
  fleetCode: z
    .string({ required_error: "Código da frota é obrigatório" })
    .min(1, "Código da frota não pode ser vazio")
    .max(30, "Máximo de 30 caracteres")
    .trim()
    .toUpperCase(),
  plate: z
    .string({ required_error: "Placa é obrigatória" })
    .min(5, "Placa inválida")
    .max(10, "Máximo de 10 caracteres")
    .trim()
    .toUpperCase()
    .transform((val) => val.replace(/[^A-Z0-9]/g, "")),
  category: vehicleCategoryEnum,
  brand: z
    .string({ required_error: "Marca é obrigatória" })
    .min(1, "Marca não pode ser vazia")
    .max(60)
    .trim(),
  model: z
    .string({ required_error: "Modelo é obrigatório" })
    .min(1, "Modelo não pode ser vazio")
    .max(80)
    .trim(),
  year: z.coerce
    .number({ required_error: "Ano é obrigatório" })
    .int("Ano deve ser um número inteiro")
    .min(1960, "Ano deve ser posterior a 1960")
    .max(new Date().getFullYear() + 2, "Ano inválido"),
  fuelType: z
    .string({ required_error: "Combustível é obrigatório" })
    .min(1, "Tipo de combustível é obrigatório")
    .max(30)
    .trim(),
  purpose: z
    .string({ required_error: "Finalidade/Uso é obrigatório" })
    .min(1, "Finalidade não pode ser vazia")
    .max(120)
    .trim(),
  department: z.string().max(100).trim().optional().nullable(),
  criticality: criticalityEnum.default("MEDIA"),
  status: vehicleStatusEnum.default("ATIVO"),
  currentOdometer: z.coerce.number().int().min(0, "Quilometragem não pode ser negativa").default(0),
  isPilot: z.boolean().default(false),
  active: z.boolean().default(true),
  notes: z.string().max(1000).trim().optional().nullable(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

/**
 * Schema para validação linha a linha de CSV de Veículos
 */
export const vehicleCsvRowSchema = z.object({
  codigo_frota: z.string().min(1, "Código da frota ausente").trim().toUpperCase(),
  placa: z.string().min(5, "Placa inválida").trim().toUpperCase(),
  categoria: z.string().trim().toUpperCase().refine(
    (val) => ["ONIBUS", "CARRO", "AMBULANCIA", "VAN", "CAMINHAO", "MOTOCICLETA", "MAQUINA", "OUTRO"].includes(val),
    { message: "Categoria inválida. Use: ONIBUS, CARRO, AMBULANCIA, VAN, CAMINHAO, MOTOCICLETA, MAQUINA ou OUTRO" }
  ),
  marca: z.string().min(1, "Marca ausente").trim(),
  modelo: z.string().min(1, "Modelo ausente").trim(),
  ano: z.coerce.number().int().min(1960).max(new Date().getFullYear() + 2),
  combustivel: z.string().min(1, "Combustível ausente").trim(),
  finalidade: z.string().min(1, "Finalidade ausente").trim(),
  setor: z.string().trim().optional(),
  criticidade: z.string().trim().toUpperCase().refine(
    (val) => !val || ["BAIXA", "MEDIA", "ALTA", "CRITICA"].includes(val),
    { message: "Criticidade inválida. Use: BAIXA, MEDIA, ALTA ou CRITICA" }
  ).optional(),
  status: z.string().trim().toUpperCase().refine(
    (val) => !val || ["ATIVO", "MANUTENCAO", "INATIVO"].includes(val),
    { message: "Status inválido. Use: ATIVO, MANUTENCAO ou INATIVO" }
  ).optional(),
  observacoes: z.string().trim().optional(),
});

/**
 * Item de Plano Preventivo
 */
export const preventivePlanItemSchema = z
  .object({
    name: z.string().min(2, "Nome do item é obrigatório").max(120).trim(),
    description: z.string().max(500).trim().optional().nullable(),
    intervalKm: z.coerce.number().int().positive("Intervalo em km deve ser positivo").optional().nullable(),
    intervalDays: z.coerce.number().int().positive("Intervalo em dias deve ser positivo").optional().nullable(),
    toleranceKm: z.coerce.number().int().min(0).optional().nullable(),
    toleranceDays: z.coerce.number().int().min(0).optional().nullable(),
    priority: criticalityEnum.default("MEDIA"),
    isMandatory: z.boolean().default(true),
    orderIndex: z.coerce.number().int().default(0),
  })
  .refine(
    (data) => data.intervalKm !== null && data.intervalKm !== undefined || data.intervalDays !== null && data.intervalDays !== undefined,
    {
      message: "O item deve possuir ao menos um intervalo definido (quilômetros ou dias)",
      path: ["intervalKm"],
    }
  );

/**
 * Plano Preventivo
 */
export const preventivePlanSchema = z.object({
  name: z.string().min(2, "Nome do plano é obrigatório").max(120).trim(),
  category: vehicleCategoryEnum,
  description: z.string().max(1000).trim().optional().nullable(),
  isPublished: z.boolean().default(true),
  items: z.array(preventivePlanItemSchema).min(1, "O plano deve conter ao menos um item de manutenção"),
});

export type PreventivePlanInput = z.infer<typeof preventivePlanSchema>;

/**
 * Configurações de Projeto
 */
export const projectSettingsSchema = z.object({
  baselineYear: z.coerce.number().int().min(2020).max(2035),
  baselineAmount: z.coerce.number().min(0, "Linha de base não pode ser negativa"),
  targetReductionPercentage: z.coerce.number().min(0).max(100, "Meta percentual deve estar entre 0% e 100%"),
});

/**
 * Gestão de Usuário
 */
export const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100).trim(),
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  role: roleEnum,
  active: z.boolean().default(true),
});

/**
 * Registro de Hodômetro (R1)
 */
export const odometerReadingSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  reading: z.coerce.number().int().min(0, "A quilometragem não pode ser negativa"),
  readingDate: z.string().or(z.date()).optional(),
  isCorrection: z.boolean().default(false),
  correctionReason: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type OdometerReadingInput = z.infer<typeof odometerReadingSchema>;

/**
 * Resposta de Item de Checklist (R1)
 */
export const inspectionAnswerItemSchema = z.object({
  templateItemId: z.string().min(1, "Item do checklist é obrigatório"),
  status: z.enum(["OK", "ALERTA", "CRITICO", "NAO_SE_APLICA"]),
  notes: z.string().max(500).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

/**
 * Execução de Checklist (R1)
 */
export const inspectionExecutionSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  templateId: z.string().min(1, "Template de checklist é obrigatório"),
  odometer: z.coerce.number().int().min(0, "Hodômetro obrigatório"),
  notes: z.string().max(1000).optional().nullable(),
  answers: z.array(inspectionAnswerItemSchema).min(1, "O checklist deve conter respostas"),
});

export type InspectionExecutionInput = z.infer<typeof inspectionExecutionSchema>;

/**
 * Item de Custo / Peça da Ordem de Serviço (R1)
 */
export const maintenanceOrderItemSchema = z.object({
  description: z.string().min(2, "Descrição do item/serviço obrigatória").max(150).trim(),
  itemType: z.enum(["PECA", "SERVICO", "OUTRO"]).default("PECA"),
  quantity: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero").default(1),
  unitCost: z.coerce.number().min(0, "Valor unitário não pode ser negativo").default(0),
});

/**
 * Ordem de Serviço (R1)
 */
export const maintenanceOrderSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  type: z.enum(["PREVENTIVA", "CORRETIVA", "INSPECAO"]).default("CORRETIVA"),
  priority: criticalityEnum.default("MEDIA"),
  origin: z.string().max(60).default("OPERACIONAL"),
  planId: z.string().optional().nullable(),
  planItemId: z.string().optional().nullable(),
  inspectionId: z.string().optional().nullable(),
  description: z.string().min(3, "Descrição do serviço/problema é obrigatória").max(1000).trim(),
  diagnosis: z.string().max(1000).optional().nullable(),
  scheduledDate: z.string().or(z.date()).optional().nullable(),
  odometerAtOpen: z.coerce.number().int().min(0).optional().nullable(),
  odometerAtClose: z.coerce.number().int().min(0).optional().nullable(),
  providerName: z.string().max(100).optional().nullable(),
  documentReference: z.string().max(80).optional().nullable(), // Número de empenho / SCPI / NF
  assignedUserId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(maintenanceOrderItemSchema).default([]),
  generateDowntime: z.boolean().default(false),
  downtimeStartDate: z.string().or(z.date()).optional().nullable(),
});

export type MaintenanceOrderInput = z.infer<typeof maintenanceOrderSchema>;

/**
 * Grupo Piloto (R1)
 */
export const pilotGroupSchema = z.object({
  name: z.string().min(3, "Nome do grupo piloto é obrigatório").max(100).trim(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  vehicleIds: z.array(z.string()).default([]),
});

/**
 * Vínculo de Motorista (R1)
 */
export const vehicleAssignmentSchema = z.object({
  vehicleId: z.string().min(1, "Veículo obrigatório"),
  userId: z.string().min(1, "Motorista obrigatório"),
  notes: z.string().max(300).optional().nullable(),
});

