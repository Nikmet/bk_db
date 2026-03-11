-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'READY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationParams" (
    "id" TEXT NOT NULL,
    "forecastGuests" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "safetyPercent" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "CalculationParams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationResult" (
    "id" TEXT NOT NULL,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "paramsId" TEXT,
    "inventorySnapshotId" TEXT,

    CONSTRAINT "CalculationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "InventorySnapshot_snapshotDate_idx" ON "InventorySnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "InventorySnapshot_createdById_idx" ON "InventorySnapshot"("createdById");

-- CreateIndex
CREATE INDEX "CalculationParams_createdById_createdAt_idx" ON "CalculationParams"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "CalculationResult_createdAt_idx" ON "CalculationResult"("createdAt");

-- CreateIndex
CREATE INDEX "CalculationResult_createdById_idx" ON "CalculationResult"("createdById");

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationParams" ADD CONSTRAINT "CalculationParams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationResult" ADD CONSTRAINT "CalculationResult_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationResult" ADD CONSTRAINT "CalculationResult_paramsId_fkey" FOREIGN KEY ("paramsId") REFERENCES "CalculationParams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationResult" ADD CONSTRAINT "CalculationResult_inventorySnapshotId_fkey" FOREIGN KEY ("inventorySnapshotId") REFERENCES "InventorySnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
