import { prisma } from "../";
import { bootstrapSystemConfigurations } from "./system-configurations";

async function main(): Promise<void> {
  console.log("🌱 Bootstrapping required system configuration...");

  await prisma.$connect();
  await bootstrapSystemConfigurations(prisma);

  console.log("✅ Required system configuration bootstrapped");
}

if (import.meta.main) {
  main()
    .catch(async (e) => {
      console.error("❌ Error bootstrapping required system configuration:", e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { main };
