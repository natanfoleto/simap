-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVA', 'CORRETIVA', 'INSPECAO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RASCUNHO', 'AGENDADA', 'ABERTA', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "InspectionAnswerStatus" AS ENUM ('OK', 'ALERTA', 'CRITICO', 'NAO_SE_APLICA');

-- CreateEnum
CREATE TYPE "OdometerSource" AS ENUM ('MANUAL', 'CHECKLIST', 'ORDEM_SERVICO', 'IMPORTACAO');

-- CreateEnum
CREATE TYPE "PilotStatus" AS ENUM ('ATIVO', 'CONCLUIDO', 'SUSPENSO');

-- CreateTable
CREATE TABLE "VehicleAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "VehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PilotStatus" NOT NULL DEFAULT 'ATIVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotGroupVehicle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotGroupVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdometerReading" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT,
    "reading" INTEGER NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "OdometerSource" NOT NULL DEFAULT 'MANUAL',
    "isCorrection" BOOLEAN NOT NULL DEFAULT false,
    "correctionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdometerReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "odometer" INTEGER NOT NULL,
    "status" "InspectionAnswerStatus" NOT NULL DEFAULT 'OK',
    "hasAlert" BOOLEAN NOT NULL DEFAULT false,
    "hasCritical" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionAnswer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "templateItemId" TEXT NOT NULL,
    "status" "InspectionAnswerStatus" NOT NULL DEFAULT 'OK',
    "notes" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "InspectionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'CORRETIVA',
    "status" "OrderStatus" NOT NULL DEFAULT 'ABERTA',
    "priority" "Criticality" NOT NULL DEFAULT 'MEDIA',
    "origin" TEXT NOT NULL DEFAULT 'OPERACIONAL',
    "planId" TEXT,
    "planItemId" TEXT,
    "inspectionId" TEXT,
    "description" TEXT NOT NULL,
    "diagnosis" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "odometerAtOpen" INTEGER,
    "odometerAtClose" INTEGER,
    "partsCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "laborCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "providerName" TEXT,
    "documentReference" TEXT,
    "assignedUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceOrderItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'PECA',
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDowntime" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "orderId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDowntime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleAssignment_tenantId_idx" ON "VehicleAssignment"("tenantId");
CREATE INDEX "VehicleAssignment_vehicleId_idx" ON "VehicleAssignment"("vehicleId");
CREATE INDEX "VehicleAssignment_userId_idx" ON "VehicleAssignment"("userId");
CREATE UNIQUE INDEX "VehicleAssignment_vehicleId_userId_key" ON "VehicleAssignment"("vehicleId", "userId");

-- CreateIndex
CREATE INDEX "PilotGroup_tenantId_idx" ON "PilotGroup"("tenantId");
CREATE INDEX "PilotGroup_status_idx" ON "PilotGroup"("status");

-- CreateIndex
CREATE INDEX "PilotGroupVehicle_tenantId_idx" ON "PilotGroupVehicle"("tenantId");
CREATE INDEX "PilotGroupVehicle_groupId_idx" ON "PilotGroupVehicle"("groupId");
CREATE INDEX "PilotGroupVehicle_vehicleId_idx" ON "PilotGroupVehicle"("vehicleId");
CREATE UNIQUE INDEX "PilotGroupVehicle_groupId_vehicleId_key" ON "PilotGroupVehicle"("groupId", "vehicleId");

-- CreateIndex
CREATE INDEX "OdometerReading_tenantId_idx" ON "OdometerReading"("tenantId");
CREATE INDEX "OdometerReading_vehicleId_idx" ON "OdometerReading"("vehicleId");
CREATE INDEX "OdometerReading_readingDate_idx" ON "OdometerReading"("readingDate");
CREATE INDEX "OdometerReading_createdAt_idx" ON "OdometerReading"("createdAt");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_tenantId_idx" ON "ChecklistTemplate"("tenantId");
CREATE INDEX "ChecklistTemplate_category_idx" ON "ChecklistTemplate"("category");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_tenantId_idx" ON "ChecklistTemplateItem"("tenantId");
CREATE INDEX "ChecklistTemplateItem_templateId_idx" ON "ChecklistTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "Inspection_tenantId_idx" ON "Inspection"("tenantId");
CREATE INDEX "Inspection_vehicleId_idx" ON "Inspection"("vehicleId");
CREATE INDEX "Inspection_userId_idx" ON "Inspection"("userId");
CREATE INDEX "Inspection_performedAt_idx" ON "Inspection"("performedAt");

-- CreateIndex
CREATE INDEX "InspectionAnswer_tenantId_idx" ON "InspectionAnswer"("tenantId");
CREATE INDEX "InspectionAnswer_inspectionId_idx" ON "InspectionAnswer"("inspectionId");
CREATE UNIQUE INDEX "InspectionAnswer_inspectionId_templateItemId_key" ON "InspectionAnswer"("inspectionId", "templateItemId");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_tenantId_idx" ON "MaintenanceOrder"("tenantId");
CREATE INDEX "MaintenanceOrder_vehicleId_idx" ON "MaintenanceOrder"("vehicleId");
CREATE INDEX "MaintenanceOrder_status_idx" ON "MaintenanceOrder"("status");
CREATE INDEX "MaintenanceOrder_type_idx" ON "MaintenanceOrder"("type");
CREATE INDEX "MaintenanceOrder_openedAt_idx" ON "MaintenanceOrder"("openedAt");
CREATE INDEX "MaintenanceOrder_completedAt_idx" ON "MaintenanceOrder"("completedAt");
CREATE UNIQUE INDEX "MaintenanceOrder_tenantId_orderNumber_key" ON "MaintenanceOrder"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "MaintenanceOrderItem_tenantId_idx" ON "MaintenanceOrderItem"("tenantId");
CREATE INDEX "MaintenanceOrderItem_orderId_idx" ON "MaintenanceOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "VehicleDowntime_tenantId_idx" ON "VehicleDowntime"("tenantId");
CREATE INDEX "VehicleDowntime_vehicleId_idx" ON "VehicleDowntime"("vehicleId");
CREATE INDEX "VehicleDowntime_startDate_idx" ON "VehicleDowntime"("startDate");

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotGroup" ADD CONSTRAINT "PilotGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PilotGroupVehicle" ADD CONSTRAINT "PilotGroupVehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotGroupVehicle" ADD CONSTRAINT "PilotGroupVehicle_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PilotGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotGroupVehicle" ADD CONSTRAINT "PilotGroupVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionAnswer" ADD CONSTRAINT "InspectionAnswer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionAnswer" ADD CONSTRAINT "InspectionAnswer_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionAnswer" ADD CONSTRAINT "InspectionAnswer_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "ChecklistTemplateItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PreventivePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PreventivePlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrderItem" ADD CONSTRAINT "MaintenanceOrderItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceOrderItem" ADD CONSTRAINT "MaintenanceOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MaintenanceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDowntime" ADD CONSTRAINT "VehicleDowntime_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleDowntime" ADD CONSTRAINT "VehicleDowntime_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleDowntime" ADD CONSTRAINT "VehicleDowntime_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MaintenanceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
