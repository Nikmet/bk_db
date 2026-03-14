import { OrderMode, PrismaClient, Unit, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function seedUser() {
  const username = "admin";
  const passwordHash = "auth-disabled";

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      username,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  return user;
}

async function seedCategories() {
  const categories = [
    { code: "FREEZER", name: "Фризер", sortOrder: 10 },
    { code: "COOLER", name: "Кулер", sortOrder: 20 },
    { code: "DRY_STOCK", name: "Сухой сток", sortOrder: 30 },
  ];

  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const record = await prisma.productCategory.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
      create: category,
    });

    categoryMap.set(category.code, record.id);
  }

  return categoryMap;
}

async function seedProducts(categoryMap: Map<string, string>) {
  const products = [
    {
      code: "BUN_CLASSIC",
      name: "Булочка классическая",
      unit: Unit.PIECE,
      unitsPerBox: 120,
      unitsPerPack: 12,
      orderMode: OrderMode.BOX,
      orderStep: 1,
      consumptionRate: 1.15,
      isActive: true,
      categoryCode: "DRY_STOCK",
    },
    {
      code: "PATTY_BEEF_100",
      name: "Котлета говяжья 100г",
      unit: Unit.PIECE,
      unitsPerBox: 200,
      unitsPerPack: 20,
      orderMode: OrderMode.BOX,
      orderStep: 1,
      consumptionRate: 1,
      isActive: true,
      categoryCode: "FREEZER",
    },
    {
      code: "FRIES_9X9",
      name: "Картофель фри 9x9",
      unit: Unit.KILOGRAM,
      unitsPerBox: 15,
      unitsPerPack: 2,
      orderMode: OrderMode.PACK,
      orderStep: 1,
      consumptionRate: 0.085,
      isActive: true,
      categoryCode: "FREEZER",
    },
    {
      code: "CHEDDAR_SLICE",
      name: "Сыр чеддер ломтики",
      unit: Unit.PIECE,
      unitsPerBox: 960,
      unitsPerPack: 96,
      orderMode: OrderMode.PACK,
      orderStep: 1,
      consumptionRate: 1.05,
      isActive: true,
      categoryCode: "COOLER",
    },
    {
      code: "ICEBERG_LETTUCE",
      name: "Салат айсберг",
      unit: Unit.KILOGRAM,
      unitsPerBox: 8,
      unitsPerPack: 1,
      orderMode: OrderMode.PIECE,
      orderStep: 1,
      consumptionRate: 0.032,
      isActive: true,
      categoryCode: "COOLER",
    },
    {
      code: "COLA_SYRUP",
      name: "Сироп Cola",
      unit: Unit.LITER,
      unitsPerBox: 20,
      unitsPerPack: 5,
      orderMode: OrderMode.PACK,
      orderStep: 1,
      consumptionRate: 0.12,
      isActive: true,
      categoryCode: "DRY_STOCK",
    },
  ];

  for (const product of products) {
    const categoryId = categoryMap.get(product.categoryCode);

    if (!categoryId) {
      throw new Error(`Category not found for code: ${product.categoryCode}`);
    }

    await prisma.product.upsert({
      where: { code: product.code },
      update: {
        name: product.name,
        unit: product.unit,
        unitsPerBox: product.unitsPerBox,
        unitsPerPack: product.unitsPerPack,
        orderMode: product.orderMode,
        orderStep: product.orderStep,
        consumptionRate: product.consumptionRate,
        isActive: product.isActive,
        categoryId,
      },
      create: {
        code: product.code,
        name: product.name,
        unit: product.unit,
        unitsPerBox: product.unitsPerBox,
        unitsPerPack: product.unitsPerPack,
        orderMode: product.orderMode,
        orderStep: product.orderStep,
        consumptionRate: product.consumptionRate,
        isActive: product.isActive,
        categoryId,
      },
    });
  }
}

async function main() {
  const user = await seedUser();
  const categoryMap = await seedCategories();
  await seedProducts(categoryMap);

  console.log(`Seed user created: ${user.username}`);
  console.log("Auth is disabled, password is not used.");
  console.log("Seed categories created: Фризер, Кулер, Сухой сток");
  console.log("Seed products created: 6 items");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
