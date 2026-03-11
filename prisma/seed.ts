import { UserRole, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const rawPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = await hash(rawPassword, 10);

  await prisma.user.upsert({
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

  console.log(`Seed user created: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
