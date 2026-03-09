import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_AI_CONFIGURATION,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_LANDING_PAGE_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_TERMS_CONTENT,
  SYSTEM_CONFIGURATION_KEYS,
} from "@rezumerai/types";
import { type Prisma, prisma } from "../";

const AI_PROVIDER_SEED = [
  {
    name: "openrouter",
    models: [
      {
        name: "Arcee AI: Trinity Large Preview (free)",
        modelId: "arcee-ai/trinity-large-preview:free",
      },
      {
        name: "StepFun: Step 3.5 Flash (free)",
        modelId: "stepfun/step-3.5-flash:free",
      },
      {
        name: "Z.ai: GLM 4.5 Air (free)",
        modelId: "z-ai/glm-4.5-air:free",
      },
      {
        name: "NVIDIA: Nemotron 3 Nano 30B A3B (free)",
        modelId: "nvidia/nemotron-3-nano-30b-a3b:free",
      },
      {
        name: "Qwen: Qwen3 235B A22B Thinking 2507",
        modelId: "qwen/qwen3-235b-a22b-thinking-2507",
      },
      {
        name: "OpenAI: gpt-oss-120b (free)",
        modelId: "openai/gpt-oss-120b:free",
      },
      {
        name: "Meta: Llama 3.3 70B Instruct (free)",
        modelId: "meta-llama/llama-3.3-70b-instruct:free",
      },
      {
        name: "Google: Gemma 3 27B (free)",
        modelId: "google/gemma-3-27b-it:free",
      },
    ],
  },
] as const;

const GLOBAL_CONFIG_SEED = {
  ERROR_LOG_RETENTION_DAYS: 90,
} as const;

const DEFAULT_AI_CONFIGURATION_JSON: Prisma.InputJsonValue = DEFAULT_AI_CONFIGURATION;
const GLOBAL_CONFIG_SEED_JSON: Prisma.InputJsonValue = GLOBAL_CONFIG_SEED;

async function seedAiProvidersAndModels(): Promise<void> {
  console.log("🤖 Seeding AI providers and models...");

  for (const providerSeed of AI_PROVIDER_SEED) {
    const provider = await prisma.aiProvider.upsert({
      where: { name: providerSeed.name },
      update: {},
      create: { name: providerSeed.name },
    });

    for (const modelSeed of providerSeed.models) {
      await prisma.aiModel.upsert({
        where: {
          providerId_modelId: {
            providerId: provider.id,
            modelId: modelSeed.modelId,
          },
        },
        update: {
          name: modelSeed.name,
          isActive: true,
        },
        create: {
          name: modelSeed.name,
          modelId: modelSeed.modelId,
          providerId: provider.id,
          isActive: true,
        },
      });
    }
  }

  console.log("✅ AI providers and models seeded");
}

async function seedSystemConfigurations(): Promise<void> {
  console.log("⚙️  Seeding system configuration...");

  await prisma.systemConfiguration.upsert({
    where: { name: SYSTEM_CONFIGURATION_KEYS.AI_CONFIG },
    update: {
      description: "Global AI model and optimization configuration used across the application.",
      value: DEFAULT_AI_CONFIGURATION_JSON,
    },
    create: {
      name: SYSTEM_CONFIGURATION_KEYS.AI_CONFIG,
      description: "Global AI model and optimization configuration used across the application.",
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
  console.log("🌱 Seeding AI configuration...");

  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ AI seeding is disabled in production");
  }

  await prisma.$connect();
  await seedAiProvidersAndModels();
  await seedSystemConfigurations();
}

main()
  .catch(async (e) => {
    console.error("❌ Error seeding AI configuration:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
