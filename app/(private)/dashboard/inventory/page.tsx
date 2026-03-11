import { InventoryTableForm } from "@/components/features/inventory-table-form";
import { prisma } from "@/lib/prisma";

export default async function DashboardInventoryPage() {
  const categoriesFromDb = await prisma.productCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: { isActive: true },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          unitsPerBox: true,
          unitsPerPack: true,
        },
      },
    },
  });

  const categories = categoriesFromDb
    .map((category) => ({
      id: category.id,
      name: category.name,
      products: category.products,
    }))
    .filter((category) => category.products.length > 0);

  return <InventoryTableForm categories={categories} />;
}
