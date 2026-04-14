-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_code_key" ON "Restaurant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_name_key" ON "Restaurant"("name");

-- CreateIndex
CREATE INDEX "Restaurant_isActive_idx" ON "Restaurant"("isActive");

-- CreateIndex
CREATE INDEX "Restaurant_name_idx" ON "Restaurant"("name");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "fullName" TEXT;
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN "restaurantId" TEXT;

-- Seed default restaurant for backfill
INSERT INTO "Restaurant" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES (
    'restaurant_bk_main',
    'BK_MAIN',
    'Burger King - Основной склад',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Backfill users
UPDATE "User"
SET "fullName" = COALESCE(NULLIF(TRIM("username"), ''), 'Пользователь')
WHERE "fullName" IS NULL;

UPDATE "User"
SET "isActive" = true
WHERE "isActive" IS NULL;

UPDATE "User"
SET "restaurantId" = 'restaurant_bk_main'
WHERE "role" = 'MANAGER'
  AND "restaurantId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "isActive" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventorySession" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "ForecastSession" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "OrderCalculation" ADD COLUMN "restaurantId" TEXT;

-- Backfill restaurant scope for existing operational data
UPDATE "InventorySession"
SET "restaurantId" = 'restaurant_bk_main'
WHERE "restaurantId" IS NULL;

UPDATE "ForecastSession"
SET "restaurantId" = 'restaurant_bk_main'
WHERE "restaurantId" IS NULL;

UPDATE "OrderCalculation"
SET "restaurantId" = 'restaurant_bk_main'
WHERE "restaurantId" IS NULL;

ALTER TABLE "InventorySession" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "ForecastSession" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "OrderCalculation" ALTER COLUMN "restaurantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "User_restaurantId_idx" ON "User"("restaurantId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "InventorySession_restaurantId_idx" ON "InventorySession"("restaurantId");

-- CreateIndex
CREATE INDEX "ForecastSession_restaurantId_idx" ON "ForecastSession"("restaurantId");

-- CreateIndex
CREATE INDEX "OrderCalculation_restaurantId_idx" ON "OrderCalculation"("restaurantId");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession"
ADD CONSTRAINT "InventorySession_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastSession"
ADD CONSTRAINT "ForecastSession_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCalculation"
ADD CONSTRAINT "OrderCalculation_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
