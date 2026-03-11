"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryFormSchema, type InventoryFormValues } from "@/lib/validation/inventory";

export interface SaveInventorySessionResult {
  ok: boolean;
  message: string;
  nextUrl?: string;
}

export async function saveInventorySessionAction(values: InventoryFormValues): Promise<SaveInventorySessionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Сессия истекла. Выполните вход повторно.",
    };
  }

  const parsed = inventoryFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность заполнения таблицы.",
    };
  }

  const { rows } = parsed.data;
  const productIds = rows.map((row) => row.productId);

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      isActive: true,
    },
    select: {
      id: true,
      unitsPerBox: true,
      unitsPerPack: true,
    },
  });

  if (products.length !== productIds.length) {
    return {
      ok: false,
      message: "Не удалось найти часть товаров. Обновите страницу и повторите попытку.",
    };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const inventoryItems = rows.map((row) => {
    const product = productMap.get(row.productId);

    if (!product) {
      throw new Error(`Product not found: ${row.productId}`);
    }

    const totalQuantity =
      row.boxCount * product.unitsPerBox +
      row.packCount * product.unitsPerPack +
      row.pieceCount;

    return {
      productId: row.productId,
      boxCount: row.boxCount,
      packCount: row.packCount,
      pieceCount: row.pieceCount,
      totalQuantity,
    };
  });

  await prisma.$transaction(async (tx) => {
    const inventorySession = await tx.inventorySession.create({
      data: {
        sessionDate: new Date(),
        location: "Burger King - Основной склад",
        createdById: session.user.id,
      },
    });

    await tx.inventoryItem.createMany({
      data: inventoryItems.map((item) => ({
        sessionId: inventorySession.id,
        productId: item.productId,
        boxCount: item.boxCount,
        packCount: item.packCount,
        pieceCount: item.pieceCount,
        totalQuantity: item.totalQuantity,
      })),
    });
  });

  revalidatePath("/dashboard/inventory");

  return {
    ok: true,
    message: "Остатки успешно сохранены.",
    nextUrl: "/dashboard/forecast",
  };
}
