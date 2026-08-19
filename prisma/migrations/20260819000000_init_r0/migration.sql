-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GESTOR', 'OPERADOR', 'MOTORISTA', 'AUDITOR');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('ONIBUS', 'CARRO', 'AMBULANCIA', 'VAN', 'CAMINHAO', 'MOTOCICLETA', 'MAQUINA', 'OUTRO');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ATIVO', 'MANUTENCAO', 'INATIVO');

-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('VALIDADO', 'EM_ANDAMENTO', 'PENDENTE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cnpj" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERADOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "systemName" TEXT NOT NULL DEFAULT 'SIMAP',
    "durationMonths" INTEGER NOT NULL DEFAULT 8,
    "theme" TEXT NOT NULL DEFAULT 'Transporte Público',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "deliverable" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDENTE',
    "completionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fleetCode" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "department" TEXT,
    "criticality" "Criticality" NOT NULL DEFAULT 'MEDIA',
    "status" "VehicleStatus" NOT NULL DEFAULT 'ATIVO',
    "currentOdometer" INTEGER NOT NULL DEFAULT 0,
    "isPilot" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventivePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventivePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventivePlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "intervalKm" INTEGER,
    "intervalDays" INTEGER,
    "toleranceKm" INTEGER,
    "toleranceDays" INTEGER,
    "priority" "Criticality" NOT NULL DEFAULT 'MEDIA',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventivePlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePreventivePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VehiclePreventivePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX "Tenant_active_idx" ON "Tenant"("active");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE UNIQUE INDEX "UserPermission_userId_module_action_key" ON "UserPermission"("userId", "module", "action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginLog_tenantId_idx" ON "LoginLog"("tenantId");
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");
CREATE INDEX "LoginLog_email_idx" ON "LoginLog"("email");
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");

-- CreateIndex
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_tenantId_idx" ON "ProjectMilestone"("tenantId");
CREATE INDEX "ProjectMilestone_monthNumber_idx" ON "ProjectMilestone"("monthNumber");
CREATE UNIQUE INDEX "ProjectMilestone_tenantId_monthNumber_key" ON "ProjectMilestone"("tenantId", "monthNumber");

-- CreateIndex
CREATE INDEX "ProjectSetting_tenantId_idx" ON "ProjectSetting"("tenantId");
CREATE UNIQUE INDEX "ProjectSetting_tenantId_key_key" ON "ProjectSetting"("tenantId", "key");

-- CreateIndex
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle"("tenantId");
CREATE INDEX "Vehicle_category_idx" ON "Vehicle"("category");
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");
CREATE INDEX "Vehicle_active_idx" ON "Vehicle"("active");
CREATE UNIQUE INDEX "Vehicle_tenantId_plate_key" ON "Vehicle"("tenantId", "plate");
CREATE UNIQUE INDEX "Vehicle_tenantId_fleetCode_key" ON "Vehicle"("tenantId", "fleetCode");

-- CreateIndex
CREATE INDEX "PreventivePlan_tenantId_idx" ON "PreventivePlan"("tenantId");
CREATE INDEX "PreventivePlan_category_idx" ON "PreventivePlan"("category");
CREATE INDEX "PreventivePlan_active_idx" ON "PreventivePlan"("active");

-- CreateIndex
CREATE INDEX "PreventivePlanItem_planId_idx" ON "PreventivePlanItem"("planId");
CREATE INDEX "PreventivePlanItem_tenantId_idx" ON "PreventivePlanItem"("tenantId");

-- CreateIndex
CREATE INDEX "VehiclePreventivePlan_tenantId_idx" ON "VehiclePreventivePlan"("tenantId");
CREATE INDEX "VehiclePreventivePlan_vehicleId_idx" ON "VehiclePreventivePlan"("vehicleId");
CREATE INDEX "VehiclePreventivePlan_planId_idx" ON "VehiclePreventivePlan"("planId");
CREATE UNIQUE INDEX "VehiclePreventivePlan_vehicleId_planId_key" ON "VehiclePreventivePlan"("vehicleId", "planId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSetting" ADD CONSTRAINT "ProjectSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlan" ADD CONSTRAINT "PreventivePlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlanItem" ADD CONSTRAINT "PreventivePlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PreventivePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivePlanItem" ADD CONSTRAINT "PreventivePlanItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePreventivePlan" ADD CONSTRAINT "VehiclePreventivePlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePreventivePlan" ADD CONSTRAINT "VehiclePreventivePlan_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePreventivePlan" ADD CONSTRAINT "VehiclePreventivePlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PreventivePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
