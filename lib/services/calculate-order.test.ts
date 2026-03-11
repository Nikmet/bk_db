import { describe, expect, it } from "vitest";

import {
  calculateOrderItem,
  getDaysBetween,
  roundUpByOrderMode,
} from "./calculate-order";

describe("roundUpByOrderMode", () => {
  it("rounds PIECE mode to integer up", () => {
    expect(roundUpByOrderMode(3.01, "PIECE", 10)).toBe(4);
  });

  it("rounds PACK mode to orderStep multiplicity", () => {
    expect(roundUpByOrderMode(12.1, "PACK", 5)).toBe(15);
  });

  it("rounds BOX mode to orderStep multiplicity", () => {
    expect(roundUpByOrderMode(6.1, "BOX", 2.5)).toBe(7.5);
  });
});

describe("calculateOrderItem", () => {
  it("calculates predicted consumption, safety stock and rounded order for PIECE", () => {
    const result = calculateOrderItem({
      currentStock: 10,
      turnoverToNextDelivery: 1000,
      consumptionRate: 0.02,
      safetyStockDays: 2,
      daysToNextDelivery: 5,
      orderMode: "PIECE",
      orderStep: 1,
    });

    expect(result.currentStock).toBe(10);
    expect(result.predictedConsumption).toBe(20);
    expect(result.averageDailyConsumption).toBe(4);
    expect(result.safetyStockQuantity).toBe(8);
    expect(result.recommendedOrderQty).toBe(18);
    expect(result.recommendedOrderRoundedQty).toBe(18);
  });

  it("returns zero when required quantity is below zero", () => {
    const result = calculateOrderItem({
      currentStock: 50,
      turnoverToNextDelivery: 1000,
      consumptionRate: 0.02,
      safetyStockDays: 1,
      daysToNextDelivery: 5,
      orderMode: "PIECE",
      orderStep: 1,
    });

    expect(result.recommendedOrderQty).toBe(0);
    expect(result.recommendedOrderRoundedQty).toBe(0);
  });

  it("rounds required quantity by PACK order step", () => {
    const result = calculateOrderItem({
      currentStock: 0,
      turnoverToNextDelivery: 121,
      consumptionRate: 0.1,
      safetyStockDays: 0,
      daysToNextDelivery: 1,
      orderMode: "PACK",
      orderStep: 5,
    });

    expect(result.recommendedOrderQty).toBe(12.1);
    expect(result.recommendedOrderRoundedQty).toBe(15);
  });
});

describe("getDaysBetween", () => {
  it("returns at least one day", () => {
    const sameDay = new Date("2026-03-11T10:00:00.000Z");
    expect(getDaysBetween(sameDay, sameDay)).toBe(1);
  });

  it("returns ceiling number of days", () => {
    const start = new Date("2026-03-11T00:00:00.000Z");
    const end = new Date("2026-03-13T12:00:00.000Z");
    expect(getDaysBetween(start, end)).toBe(3);
  });
});

