-- CreateTable
CREATE TABLE "AnnualMaintenanceBudget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "baselineAmount" DECIMAL(12,2) NOT NULL DEFAULT 285000,
    "targetReductionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "plannedPreventive" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "plannedCorrective" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "plannedContingency" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualMaintenanceBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "preventiveCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "correctiveCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "preventiveOrders" INTEGER NOT NULL DEFAULT 0,
    "correctiveOrders" INTEGER NOT NULL DEFAULT 0,
    "totalKmDriven" INTEGER,
    "costPerKm" DECIMAL(12,4),
    "availabilityPercentage" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "totalDowntimeHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "preventiveCompliancePercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "dataQualityScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "metricsData" JSONB NOT NULL,
    "isFrozen" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyProjectUpdate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "advancesSummary" TEXT NOT NULL,
    "nextSteps" TEXT NOT NULL,
    "observations" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnualMaintenanceBudget_tenantId_idx" ON "AnnualMaintenanceBudget"("tenantId");
CREATE INDEX "AnnualMaintenanceBudget_year_idx" ON "AnnualMaintenanceBudget"("year");
CREATE UNIQUE INDEX "AnnualMaintenanceBudget_tenantId_year_key" ON "AnnualMaintenanceBudget"("tenantId", "year");

-- CreateIndex
CREATE INDEX "KpiSnapshot_tenantId_idx" ON "KpiSnapshot"("tenantId");
CREATE INDEX "KpiSnapshot_referenceYear_referenceMonth_idx" ON "KpiSnapshot"("referenceYear", "referenceMonth");
CREATE UNIQUE INDEX "KpiSnapshot_tenantId_referenceYear_referenceMonth_key" ON "KpiSnapshot"("tenantId", "referenceYear", "referenceMonth");

-- CreateIndex
CREATE INDEX "MonthlyProjectUpdate_tenantId_idx" ON "MonthlyProjectUpdate"("tenantId");
CREATE UNIQUE INDEX "MonthlyProjectUpdate_tenantId_referenceYear_referenceMonth_key" ON "MonthlyProjectUpdate"("tenantId", "referenceYear", "referenceMonth");

-- AddForeignKey
ALTER TABLE "AnnualMaintenanceBudget" ADD CONSTRAINT "AnnualMaintenanceBudget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyProjectUpdate" ADD CONSTRAINT "MonthlyProjectUpdate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
