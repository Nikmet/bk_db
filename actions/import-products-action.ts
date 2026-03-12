"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCategoryCode, mapOrderMode, mapUnit, normalizeProductCode } from "@/lib/utils/product-import";
import { productImportRowSchema, type ProductImportDraftRow } from "@/lib/validation/product-import";

export interface ImportProductsActionResult {
  ok: boolean;
  message: string;
  added: number;
  updated: number;
  skipped: number;
}

function getUniqueCategoryCode(baseCode: string, usedCodes: Set<string>): string {
  if (!usedCodes.has(baseCode)) {
    usedCodes.add(baseCode);
    return baseCode;
  }

  let index = 2;
  while (usedCodes.has(`${baseCode}_${index}`)) {
    index += 1;
  }

  const nextCode = `${baseCode}_${index}`;
  usedCodes.add(nextCode);
  return nextCode;
}

export async function importProductsAction(rows: ProductImportDraftRow[]): Promise<ImportProductsActionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Сессия истекла. Выполните вход повторно.",
      added: 0,
      updated: 0,
      skipped: rows.length,
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      ok: false,
      message: "Недостаточно прав для импорта товаров.",
      added: 0,
      updated: 0,
      skipped: rows.length,
    };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      ok: false,
      message: "Файл не содержит строк для импорта.",
      added: 0,
      updated: 0,
      skipped: 0,
    };
  }

  let skipped = 0;
  const parsedRows: Array<{
    code: string;
    name: string;
    category: string;
    unitsPerBox: number;
    unitsPerPack: number;
    unit: string;
    consumptionRate: number;
    orderMode: string;
    orderStep: number;
  }> = [];

  for (const row of rows) {
    const parsed = productImportRowSchema.safeParse(row);

    if (!parsed.success) {
      skipped += 1;
      continue;
    }

    parsedRows.push({
      ...parsed.data,
      code: normalizeProductCode(parsed.data.code),
    });
  }

  if (parsedRows.length === 0) {
    return {
      ok: false,
      message: "Все строки пропущены из-за ошибок валидации.",
      added: 0,
      updated: 0,
      skipped,
    };
  }

  const duplicates = new Set<string>();
  const seenCodes = new Set<string>();

  for (const row of parsedRows) {
    if (seenCodes.has(row.code)) {
      duplicates.add(row.code);
    }
    seenCodes.add(row.code);
  }

  const importRows = parsedRows.filter((row) => {
    if (duplicates.has(row.code)) {
      skipped += 1;
      return false;
    }

    const mappedUnit = mapUnit(row.unit);
    const mappedOrderMode = mapOrderMode(row.orderMode);

    if (!mappedUnit || !mappedOrderMode) {
      skipped += 1;
      return false;
    }

    return true;
  });

  if (importRows.length === 0) {
    return {
      ok: false,
      message: "Все строки пропущены",
      added: 0,
      updated: 0,
      skipped,
    };
  }

  const result = await prisma.$transaction(
    async (tx) => {
      let added = 0;
      let updated = 0;

      const existingProducts = await tx.product.findMany({
        where: {
          code: {
            in: importRows.map((row) => row.code),
          },
        },
        select: {
          id: true,
          code: true,
        },
      });

      const productByCode = new Map(existingProducts.map((product) => [product.code, product]));

      const existingCategories = await tx.productCategory.findMany({
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      const categoryByName = new Map(existingCategories.map((category) => [category.name.trim().toLowerCase(), category]));
      const usedCategoryCodes = new Set(existingCategories.map((category) => category.code));

      for (const row of importRows) {
        const mappedUnit = mapUnit(row.unit);
        const mappedOrderMode = mapOrderMode(row.orderMode);

        if (!mappedUnit || !mappedOrderMode) {
          skipped += 1;
          continue;
        }

        const categoryName = row.category.trim();
        const categoryKey = categoryName.toLowerCase();

        let category = categoryByName.get(categoryKey);

        if (!category) {
          const baseCode = buildCategoryCode(categoryName);
          const categoryCode = getUniqueCategoryCode(baseCode, usedCategoryCodes);

          category = await tx.productCategory.create({
            data: {
              code: categoryCode,
              name: categoryName,
            },
            select: {
              id: true,
              code: true,
              name: true,
            },
          });

          categoryByName.set(categoryKey, category);
        }

        const productData = {
          name: row.name.trim(),
          categoryId: category.id,
          unitsPerBox: Math.trunc(row.unitsPerBox),
          unitsPerPack: Math.trunc(row.unitsPerPack),
          unit: mappedUnit,
          consumptionRate: row.consumptionRate,
          orderMode: mappedOrderMode,
          orderStep: row.orderStep,
          isActive: true,
        } as const;

        const existingProduct = productByCode.get(row.code);

        if (existingProduct) {
          await tx.product.update({
            where: {
              id: existingProduct.id,
            },
            data: productData,
          });
          updated += 1;
        } else {
          const createdProduct = await tx.product.create({
            data: {
              code: row.code,
              ...productData,
            },
            select: {
              id: true,
              code: true,
            },
          });
          productByCode.set(createdProduct.code, createdProduct);
          added += 1;
        }
      }

      const ok = added > 0 || updated > 0;

      return {
        ok,
        message: ok ? "Импорт завершён" : "Все строки пропущены",
        added,
        updated,
        skipped,
      };
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  if (result.ok) {
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/products/import");
    revalidatePath("/dashboard/inventory");
  }

  return result;
}
