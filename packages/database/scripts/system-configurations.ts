import { DEFAULT_AI_CONFIGURATION, normalizeAiConfiguration } from "../../types/src/ai/schema";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_AI_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_LANDING_PAGE_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_TERMS_CONTENT,
  SYSTEM_CONFIGURATION_KEYS,
} from "../../types/src/content/schema";
import type { Prisma } from "../";

const GLOBAL_CONFIG_SEED = {
  ERROR_LOG_RETENTION_DAYS: 90,
} as const;

const AI_CIRCUIT_BREAKER_CONFIG_DESCRIPTION =
  "Circuit breaker settings for AI provider calls to prevent cascading failures during outages.";

const AI_CONFIG_DESCRIPTION =
  "Global AI models, workflow-specific prompts, and optimization configuration used across the application.";
const GLOBAL_CONFIG_DESCRIPTION =
  "Application-wide operational settings, including backend retention windows and scheduled jobs.";

export type RequiredSystemConfigurationSeed = {
  name: string;
  description: string;
  value: Prisma.InputJsonValue;
};

export type SystemConfigurationWriter = {
  systemConfiguration: {
    upsert(args: {
      where: { name: string };
      update: {
        description?: string;
        value?: Prisma.InputJsonValue;
      };
      create: RequiredSystemConfigurationSeed;
    }): Promise<unknown>;
  };
};

export function getRequiredSystemConfigurationSeeds(): RequiredSystemConfigurationSeed[] {
  const defaultAiConfigurationJson: Prisma.InputJsonValue = normalizeAiConfiguration(DEFAULT_AI_CONFIGURATION);
  const globalConfigSeedJson: Prisma.InputJsonValue = GLOBAL_CONFIG_SEED;
  const aiCircuitBreakerConfigJson: Prisma.InputJsonValue = DEFAULT_AI_CIRCUIT_BREAKER_CONFIG;

  return [
    {
      name: SYSTEM_CONFIGURATION_KEYS.AI_CONFIG,
      description: AI_CONFIG_DESCRIPTION,
      value: defaultAiConfigurationJson,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.GLOBAL_CONFIG,
      description: GLOBAL_CONFIG_DESCRIPTION,
      value: globalConfigSeedJson,
    },
    {
      name: SYSTEM_CONFIGURATION_KEYS.AI_CIRCUIT_BREAKER_CONFIG,
      description: AI_CIRCUIT_BREAKER_CONFIG_DESCRIPTION,
      value: aiCircuitBreakerConfigJson,
    },
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
  ];
}

export async function bootstrapSystemConfigurations(db: SystemConfigurationWriter): Promise<void> {
  for (const seed of getRequiredSystemConfigurationSeeds()) {
    await db.systemConfiguration.upsert({
      where: { name: seed.name },
      update: {},
      create: seed,
    });
  }
}

export async function seedSystemConfigurations(db: SystemConfigurationWriter): Promise<void> {
  for (const seed of getRequiredSystemConfigurationSeeds()) {
    await db.systemConfiguration.upsert({
      where: { name: seed.name },
      update: {
        description: seed.description,
        value: seed.value,
      },
      create: seed,
    });
  }
}
