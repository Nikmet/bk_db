import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { ProductsCatalog } from "@/components/features/products-catalog";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/inventory");
  }

  const [categoriesFromDb, productsFromDb] = await Promise.all([
    prisma.productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.product.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        unitsPerBox: true,
        unitsPerPack: true,
        consumptionRate: true,
        orderMode: true,
        orderStep: true,
        isActive: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <ProductsCatalog
      categories={categoriesFromDb}
      products={productsFromDb
        .map((product) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          unit: product.unit,
          unitsPerBox: product.unitsPerBox,
          unitsPerPack: product.unitsPerPack,
          consumptionRate: product.consumptionRate,
          orderMode: product.orderMode,
          orderStep: product.orderStep,
          isActive: product.isActive,
          categoryId: product.categoryId,
          categoryName: product.category.name,
        }))
        .sort((a, b) => {
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }

          const categoryCompare = a.categoryName.localeCompare(b.categoryName, "ru");

          if (categoryCompare !== 0) {
            return categoryCompare;
          }

          return a.name.localeCompare(b.name, "ru");
        })}
    />
  );
}
