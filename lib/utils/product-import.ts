export type ProductUnitValue = "PIECE" | "KILOGRAM" | "LITER";
export type ProductOrderModeValue = "PIECE" | "PACK" | "BOX";

const unitAliases: Record<string, ProductUnitValue> = {
  piece: "PIECE",
  pieces: "PIECE",
  pcs: "PIECE",
  "шт": "PIECE",
  "штука": "PIECE",
  "штук": "PIECE",
  kilogram: "KILOGRAM",
  kilograms: "KILOGRAM",
  kg: "KILOGRAM",
  "кг": "KILOGRAM",
  "килограмм": "KILOGRAM",
  liter: "LITER",
  liters: "LITER",
  l: "LITER",
  "л": "LITER",
  "литр": "LITER",
};

const orderModeAliases: Record<string, ProductOrderModeValue> = {
  piece: "PIECE",
  pieces: "PIECE",
  "шт": "PIECE",
  pack: "PACK",
  packs: "PACK",
  "уп": "PACK",
  "упаковка": "PACK",
  box: "BOX",
  boxes: "BOX",
  "кор": "BOX",
  "короб": "BOX",
  "коробка": "BOX",
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeProductCode(value: string): string {
  return value.trim().toUpperCase();
}

export function mapUnit(value: string): ProductUnitValue | null {
  const token = normalizeToken(value);

  if (!token) {
    return null;
  }

  return unitAliases[token] ?? null;
}

export function mapOrderMode(value: string): ProductOrderModeValue | null {
  const token = normalizeToken(value);

  if (!token) {
    return null;
  }

  return orderModeAliases[token] ?? null;
}

export function buildCategoryCode(name: string): string {
  const normalized = name
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "CATEGORY";
}
