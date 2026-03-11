-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('PIECE', 'KILOGRAM', 'LITER');

-- CreateEnum
CREATE TYPE "OrderMode" AS ENUM ('PIECE', 'PACK', 'BOX');

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "Unit" NOT NULL,
    "unitsPerBox" INTEGER NOT NULL DEFAULT 0,
    "unitsPerPack" INTEGER NOT NULL DEFAULT 0,
    "orderMode" "OrderMode" NOT NULL DEFAULT 'PIECE',
    "orderStep" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "consumptionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySession" (
    "id" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "comment" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "boxCount" INTEGER NOT NULL DEFAULT 0,
    "packCount" INTEGER NOT NULL DEFAULT 0,
    "pieceCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastSession" (
    "id" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedGuests" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "safetyPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCalculation" (
    "id" TEXT NOT NULL,
    "forecastSessionId" TEXT NOT NULL,
    "inventorySessionId" TEXT,
    "createdById" TEXT,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCalculationItem" (
    "id" TEXT NOT NULL,
    "orderCalculationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "predictedConsumption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "safetyStockQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendedOrderQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendedOrderRoundedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCalculationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueHistory" (
    "id" TEXT NOT NULL,
    "revenueDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "guestCount" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_code_key" ON "ProductCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE INDEX "ProductCategory_sortOrder_idx" ON "ProductCategory"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "InventorySession_sessionDate_idx" ON "InventorySession"("sessionDate");

-- CreateIndex
CREATE INDEX "InventorySession_location_idx" ON "InventorySession"("location");

-- CreateIndex
CREATE INDEX "InventorySession_createdById_idx" ON "InventorySession"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sessionId_productId_key" ON "InventoryItem"("sessionId", "productId");

-- CreateIndex
CREATE INDEX "InventoryItem_productId_idx" ON "InventoryItem"("productId");

-- CreateIndex
CREATE INDEX "ForecastSession_forecastDate_idx" ON "ForecastSession"("forecastDate");

-- CreateIndex
CREATE INDEX "ForecastSession_createdById_idx" ON "ForecastSession"("createdById");

-- CreateIndex
CREATE INDEX "OrderCalculation_forecastSessionId_idx" ON "OrderCalculation"("forecastSessionId");

-- CreateIndex
CREATE INDEX "OrderCalculation_inventorySessionId_idx" ON "OrderCalculation"("inventorySessionId");

-- CreateIndex
CREATE INDEX "OrderCalculation_createdById_idx" ON "OrderCalculation"("createdById");

-- CreateIndex
CREATE INDEX "OrderCalculation_status_idx" ON "OrderCalculation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCalculationItem_orderCalculationId_productId_key" ON "OrderCalculationItem"("orderCalculationId", "productId");

-- CreateIndex
CREATE INDEX "OrderCalculationItem_productId_idx" ON "OrderCalculationItem"("productId");

-- CreateIndex
CREATE INDEX "RevenueHistory_revenueDate_idx" ON "RevenueHistory"("revenueDate");

-- CreateIndex
CREATE INDEX "RevenueHistory_location_revenueDate_idx" ON "RevenueHistory"("location", "revenueDate");

-- CreateIndex
CREATE INDEX "RevenueHistory_createdById_idx" ON "RevenueHistory"("createdById");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InventorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastSession" ADD CONSTRAINT "ForecastSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCalculation" ADD CONSTRAINT "OrderCalculation_forecastSessionId_fkey" FOREIGN KEY ("forecastSessionId") REFERENCES "ForecastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCalculation" ADD CONSTRAINT "OrderCalculation_inventorySessionId_fkey" FOREIGN KEY ("inventorySessionId") REFERENCES "InventorySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCalculation" ADD CONSTRAINT "OrderCalculation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCalculationItem" ADD CONSTRAINT "OrderCalculationItem_orderCalculationId_fkey" FOREIGN KEY ("orderCalculationId") REFERENCES "OrderCalculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCalculationItem" ADD CONSTRAINT "OrderCalculationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueHistory" ADD CONSTRAINT "RevenueHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
