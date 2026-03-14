"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  productManagementSchema,
  type ProductManagementValues,
} from "@/lib/validation/product-management";

export interface ManageProductActionResult {
  ok: boolean;
  message: string;
}

function revalidateProductPaths() {
  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/products/import");
  revalidatePath("/dashboard/inventory");
}

export async function createProductAction(values: ProductManagementValues): Promise<ManageProductActionResult> {
  const parsed = productManagementSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность заполнения формы.",
    };
  }

  const data = parsed.data;

  const [category, existingProduct] = await Promise.all([
    prisma.productCategory.findUnique({
      where: {
        id: data.categoryId,
      },
      select: {
        id: true,
      },
    }),
    prisma.product.findUnique({
      where: {
        code: data.code,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!category) {
    return {
      ok: false,
      message: "Выбранная категория не найдена.",
    };
  }

  if (existingProduct) {
    return {
      ok: false,
      message: "Товар с таким кодом уже существует.",
    };
  }

  await prisma.product.create({
    data,
  });

  revalidateProductPaths();

  return {
    ok: true,
    message: "Товар успешно создан.",
  };
}

export async function updateProductAction(
  productId: string,
  values: ProductManagementValues,
): Promise<ManageProductActionResult> {
  const parsed = productManagementSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность заполнения формы.",
    };
  }

  const data = parsed.data;

  const [product, category, duplicate] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    }),
    prisma.productCategory.findUnique({
      where: {
        id: data.categoryId,
      },
      select: {
        id: true,
      },
    }),
    prisma.product.findFirst({
      where: {
        code: data.code,
        NOT: {
          id: productId,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!product) {
    return {
      ok: false,
      message: "Товар не найден.",
    };
  }

  if (!category) {
    return {
      ok: false,
      message: "Выбранная категория не найдена.",
    };
  }

  if (duplicate) {
    return {
      ok: false,
      message: "Товар с таким кодом уже существует.",
    };
  }

  await prisma.product.update({
    where: {
      id: productId,
    },
    data,
  });

  revalidateProductPaths();

  return {
    ok: true,
    message: "Товар успешно обновлён.",
  };
}

export async function deactivateProductAction(productId: string): Promise<ManageProductActionResult> {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!product) {
    return {
      ok: false,
      message: "Товар не найден.",
    };
  }

  if (!product.isActive) {
    return {
      ok: true,
      message: "Товар уже деактивирован.",
    };
  }

  await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      isActive: false,
    },
  });

  revalidateProductPaths();

  return {
    ok: true,
    message: "Товар деактивирован.",
  };
}
