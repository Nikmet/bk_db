import { OrderMode, PrismaClient, Unit, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function seedRestaurants() {
  const restaurants = [
    { code: "BK_MAIN", name: "Burger King - Основной склад", isActive: true },
    { code: "BK_ARBAT", name: "Burger King Арбат", isActive: true },
  ];

  const restaurantMap = new Map();

  for (const restaurant of restaurants) {
    const record = await prisma.restaurant.upsert({
      where: {
        code: restaurant.code,
      },
      update: {
        name: restaurant.name,
        isActive: restaurant.isActive,
      },
      create: restaurant,
    });

    restaurantMap.set(restaurant.code, record.id);
  }

  return restaurantMap;
}

async function seedUsers(restaurantMap) {
  const adminPasswordHash = await hash("admin123", 10);
  const managerPasswordHash = await hash("manager123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "Системный администратор",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
      restaurantId: null,
    },
    create: {
      username: "admin",
      fullName: "Системный администратор",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const mainRestaurantId = restaurantMap.get("BK_MAIN");

  if (!mainRestaurantId) {
    throw new Error("Main restaurant not found in seed.");
  }

  const manager = await prisma.user.upsert({
    where: { username: "manager.main" },
    update: {
      fullName: "Иванов Иван",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      isActive: true,
      restaurantId: mainRestaurantId,
    },
    create: {
      username: "manager.main",
      fullName: "Иванов Иван",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      isActive: true,
      restaurantId: mainRestaurantId,
    },
  });

  return { admin, manager };
}

async function seedCategories() {
  const categories = [
    { code: "FREEZER", name: "Фризер", sortOrder: 10 },
    { code: "COOLER", name: "Кулер", sortOrder: 20 },
    { code: "DRY_STOCK", name: "Сухой сток", sortOrder: 30 },
  ];

  const categoryMap = new Map();

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

async function seedProducts(categoryMap) {
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
  const restaurantMap = await seedRestaurants();
  const users = await seedUsers(restaurantMap);
  const categoryMap = await seedCategories();
  await seedProducts(categoryMap);

  console.log(`Seed admin created: ${users.admin.username} / admin123`);
  console.log(`Seed manager created: ${users.manager.username} / manager123`);
  console.log("Seed restaurants created: Burger King - Основной склад, Burger King Арбат");
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
