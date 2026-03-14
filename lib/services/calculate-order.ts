import type { OrderMode, Prisma } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CalculateOrderItemInput {
  currentStock: number;
  turnoverToNextDelivery: number;
  consumptionRate: number;
  safetyStockDays: number;
  daysToNextDelivery: number;
  orderMode: OrderMode;
  orderStep: number;
}

export interface CalculateOrderItemResult {
  currentStock: number;
  predictedConsumption: number;
  averageDailyConsumption: number;
  safetyStockQuantity: number;
  recommendedOrderQty: number;
  recommendedOrderRoundedQty: number;
}

export interface CalculateOrderServiceInput {
  calculationDate: Date;
  nearestSupplyDate: Date;
  nextSupplyDate: Date;
  turnoverToNearestDelivery: number;
  turnoverToNextDelivery: number;
  safetyStockDays: number;
}

export interface CalculateOrderServiceResult {
  orderCalculationId: string;
}

function normalizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(diffMs / DAY_MS));
}

export function roundUpByOrderMode(rawQty: number, orderMode: OrderMode, orderStep: number): number {
  const normalizedQty = Math.max(0, normalizeNumber(rawQty));
  const normalizedStep = orderStep > 0 ? orderStep : 1;

  if (orderMode === "PIECE") {
    return Math.ceil(normalizedQty);
  }

  const rounded = Math.ceil(normalizedQty / normalizedStep) * normalizedStep;
  return Number(rounded.toFixed(6));
}

export function calculateOrderItem(input: CalculateOrderItemInput): CalculateOrderItemResult {
  const currentStock = Math.max(0, normalizeNumber(input.currentStock));
  const turnoverToNextDelivery = Math.max(0, normalizeNumber(input.turnoverToNextDelivery));
  const consumptionRate = Math.max(0, normalizeNumber(input.consumptionRate));
  const safetyStockDays = Math.max(0, normalizeNumber(input.safetyStockDays));
  const daysToNextDelivery = Math.max(1, normalizeNumber(input.daysToNextDelivery));

  const predictedConsumption = turnoverToNextDelivery * consumptionRate;
  const averageDailyConsumption = predictedConsumption / daysToNextDelivery;
  const safetyStockQuantity = averageDailyConsumption * safetyStockDays;

  const requiredQtyRaw = predictedConsumption + safetyStockQuantity - currentStock;
  const recommendedOrderQty = Math.max(0, Number(requiredQtyRaw.toFixed(6)));
  const recommendedOrderRoundedQty = roundUpByOrderMode(recommendedOrderQty, input.orderMode, input.orderStep);

  return {
    currentStock,
    predictedConsumption: Number(predictedConsumption.toFixed(6)),
    averageDailyConsumption: Number(averageDailyConsumption.toFixed(6)),
    safetyStockQuantity: Number(safetyStockQuantity.toFixed(6)),
    recommendedOrderQty,
    recommendedOrderRoundedQty,
  };
}

export async function calculateAndSaveOrder(input: CalculateOrderServiceInput): Promise<CalculateOrderServiceResult> {
  const { prisma } = await import("../prisma");
  const daysToNextDelivery = getDaysBetween(input.calculationDate, input.nextSupplyDate);

  const latestInventorySession = await prisma.inventorySession.findFirst({
    orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
    include: {
      items: {
        select: {
          productId: true,
          totalQuantity: true,
        },
      },
    },
  });

  if (!latestInventorySession) {
    throw new Error("Отсутствует сессия остатков. Сначала заполните страницу инвентаризации.");
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      orderMode: true,
      orderStep: true,
      consumptionRate: true,
    },
    orderBy: [{ code: "asc" }],
  });

  if (products.length === 0) {
    throw new Error("Не найдено активных товаров для расчёта.");
  }

  const stockByProductId = new Map(
    latestInventorySession.items.map((item) => [item.productId, item.totalQuantity]),
  );

  return prisma.$transaction(async (tx) => {
    const forecastSession = await tx.forecastSession.create({
      data: {
        forecastDate: input.calculationDate,
        predictedGuests: 0,
        leadTimeDays: daysToNextDelivery,
        safetyPercent: input.safetyStockDays,
        comment: JSON.stringify({
          nearestSupplyDate: input.nearestSupplyDate.toISOString(),
          nextSupplyDate: input.nextSupplyDate.toISOString(),
          turnoverToNearestDelivery: input.turnoverToNearestDelivery,
          turnoverToNextDelivery: input.turnoverToNextDelivery,
          safetyStockDays: input.safetyStockDays,
        }),
      },
    });

    const calculation = await tx.orderCalculation.create({
      data: {
        forecastSessionId: forecastSession.id,
        inventorySessionId: latestInventorySession.id,
        status: "READY",
        calculatedAt: new Date(),
      },
    });

    const calculatedItems = products.map((product) => {
      const result = calculateOrderItem({
        currentStock: stockByProductId.get(product.id) ?? 0,
        turnoverToNextDelivery: input.turnoverToNextDelivery,
        consumptionRate: product.consumptionRate,
        safetyStockDays: input.safetyStockDays,
        daysToNextDelivery,
        orderMode: product.orderMode,
        orderStep: product.orderStep,
      });

      return {
        product,
        result,
      };
    });

    await tx.orderCalculationItem.createMany({
      data: calculatedItems.map(({ product, result }) => ({
        orderCalculationId: calculation.id,
        productId: product.id,
        currentStock: result.currentStock,
        predictedConsumption: result.predictedConsumption,
        safetyStockQuantity: result.safetyStockQuantity,
        recommendedOrderQty: result.recommendedOrderQty,
        recommendedOrderRoundedQty: result.recommendedOrderRoundedQty,
      })),
    });

    const totalRoundedOrder = calculatedItems.reduce(
      (sum, current) => sum + current.result.recommendedOrderRoundedQty,
      0,
    );

    const summary: Prisma.InputJsonObject = {
      turnoverToNearestDelivery: input.turnoverToNearestDelivery,
      turnoverToNextDelivery: input.turnoverToNextDelivery,
      safetyStockDays: input.safetyStockDays,
      daysToNextDelivery,
      productsCount: calculatedItems.length,
      totalRoundedOrder: Number(totalRoundedOrder.toFixed(6)),
      generatedAt: new Date().toISOString(),
    };

    await tx.orderCalculation.update({
      where: {
        id: calculation.id,
      },
      data: {
        summary,
      },
    });

    return {
      orderCalculationId: calculation.id,
    };
  });
}
