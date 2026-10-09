// Seed script: creates an initial admin user
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      preference: {
        create: {
          theme: "SYSTEM",
          currency: "INR",
        },
      },
    },
  });

  console.log("✅ Seed complete. User created:", user.username);
  console.log("   Username: admin");
  console.log("   Password: admin123");
  console.log("   ⚠️  Change this password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
