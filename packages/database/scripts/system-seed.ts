import { DEFAULT_AI_CONFIGURATION, normalizeAiConfiguration } from "../../types/src/ai/schema";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_LANDING_PAGE_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_TERMS_CONTENT,
  SYSTEM_CONFIGURATION_KEYS,
} from "../../types/src/content/schema";
import { type Prisma, prisma } from "../";

const GLOBAL_CONFIG_SEED = {
  ERROR_LOG_RETENTION_DAYS: 90,
} as const;

const AI_CONFIG_DESCRIPTION =
  "Global AI models, workflow-specific prompts, and optimization configuration used across the application.";
const DEFAULT_AI_CONFIGURATION_JSON: Prisma.InputJsonValue = normalizeAiConfiguration(DEFAULT_AI_CONFIGURATION);
const GLOBAL_CONFIG_SEED_JSON: Prisma.InputJsonValue = GLOBAL_CONFIG_SEED;

async function seedSystemConfigurations(): Promise<void> {
  console.log("⚙️  Seeding system configuration...");

  await prisma.systemConfiguration.upsert({
    where: { name: SYSTEM_CONFIGURATION_KEYS.AI_CONFIG },
    update: {
      description: AI_CONFIG_DESCRIPTION,
      value: DEFAULT_AI_CONFIGURATION_JSON,
    },
    create: {
      name: SYSTEM_CONFIGURATION_KEYS.AI_CONFIG,
      description: AI_CONFIG_DESCRIPTION,
      value: DEFAULT_AI_CONFIGURATION_JSON,
    },
  });

  await prisma.systemConfiguration.upsert({
    where: { name: SYSTEM_CONFIGURATION_KEYS.GLOBAL_CONFIG },
    update: {
      description: "Application-wide operational settings, including backend retention windows and scheduled jobs.",
      value: GLOBAL_CONFIG_SEED_JSON,
    },
    create: {
      name: SYSTEM_CONFIGURATION_KEYS.GLOBAL_CONFIG,
      description: "Application-wide operational settings, including backend retention windows and scheduled jobs.",
      value: GLOBAL_CONFIG_SEED_JSON,
    },
  });

  const publicContentSeeds = [
    {
      name: SYSTEM_CONFIGURATION_KEYS.TOS_INFORMATION,
      description: "Structured Terms of Service content for public pages and assistant responses.",
      value: DEFAULT_TERMS_CONTENT,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.PRIVACY_POLICY_INFORMATION,
      description: "Structured Privacy Policy content for public pages and assistant responses.",
      value: DEFAULT_PRIVACY_CONTENT,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.FAQ_INFORMATION,
      description: "Structured FAQ content used across public pages and assistant responses.",
      value: DEFAULT_FAQ_CONTENT,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.ABOUT_US_INFORMATION,
      description: "Structured About page content for public pages and assistant responses.",
      value: DEFAULT_ABOUT_CONTENT,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.CONTACT_INFORMATION,
      description: "Structured Contact page content for public pages and assistant responses.",
      value: DEFAULT_CONTACT_CONTENT,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.LANDING_PAGE_INFORMATION,
      description: "Structured landing page content for the home page and assistant responses.",
      value: DEFAULT_LANDING_PAGE_CONTENT,
    },
  ] as const;

  for (const seed of publicContentSeeds) {
    await prisma.systemConfiguration.upsert({
      where: { name: seed.name },
      update: {
        description: seed.description,
        value: seed.value,
      },
      create: {
        name: seed.name,
        description: seed.description,
        value: seed.value,
      },
    });
  }

  console.log("✅ System configuration seeded");
}

async function main(): Promise<void> {
  console.log("🌱 Seeding system configuration...");

  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ System seeding is disabled in production");
  }

  await prisma.$connect();
  await seedSystemConfigurations();
}

main()
  .catch(async (e) => {
    console.error("❌ Error seeding system configuration:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
