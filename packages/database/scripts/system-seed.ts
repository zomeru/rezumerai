import { prisma } from "../";
import { seedSystemConfigurations } from "./system-configurations";

async function main(): Promise<void> {
  console.log("🌱 Seeding system configuration...");

  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ System seeding is disabled in production");
  }

  await prisma.$connect();
  await seedSystemConfigurations(prisma);
  console.log("✅ System configuration seeded");
}

if (import.meta.main) {
  main()
    .catch(async (e) => {
      console.error("❌ Error seeding system configuration:", e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { main };
