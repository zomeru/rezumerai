import {
  type PublicContentTopic,
  SYSTEM_CONFIGURATION_KEYS,
  type SystemConfigurationEntry,
  type SystemConfigurationListResponse,
} from "@rezumerai/types";
import { ROUTES } from "@/constants/routing";

export type AdminContentSchemaFamily = "LANDING_PAGE" | "FAQ" | "CONTENT_PAGE";

export interface AdminContentTopicMetadata {
  topic: PublicContentTopic;
  label: string;
  description: string;
  configKey: string;
  schemaFamily: AdminContentSchemaFamily;
  publicHref: string;
}

export const ADMIN_CONTENT_TOPICS = [
  {
    topic: "landing",
    label: "Landing Page",
    description: "Hero copy, product sections, trust badges, and footer marketing content.",
    configKey: SYSTEM_CONFIGURATION_KEYS.LANDING_PAGE_INFORMATION,
    schemaFamily: "LANDING_PAGE",
    publicHref: ROUTES.HOME,
  },
  {
    topic: "about",
    label: "About",
    description: "Mission, product principles, and company background shown on the public about page.",
    configKey: SYSTEM_CONFIGURATION_KEYS.ABOUT_US_INFORMATION,
    schemaFamily: "CONTENT_PAGE",
    publicHref: ROUTES.ABOUT,
  },
  {
    topic: "contact",
    label: "Contact",
    description: "Support, privacy, and contact-channel content for the public contact page.",
    configKey: SYSTEM_CONFIGURATION_KEYS.CONTACT_INFORMATION,
    schemaFamily: "CONTENT_PAGE",
    publicHref: ROUTES.CONTACT,
  },
  {
    topic: "faq",
    label: "FAQ",
    description: "Questions, answers, tags, and category groupings for public help content.",
    configKey: SYSTEM_CONFIGURATION_KEYS.FAQ_INFORMATION,
    schemaFamily: "FAQ",
    publicHref: ROUTES.FAQ,
  },
  {
    topic: "privacy",
    label: "Privacy Policy",
    description: "Privacy disclosures, data handling sections, and linked policy CTA content.",
    configKey: SYSTEM_CONFIGURATION_KEYS.PRIVACY_POLICY_INFORMATION,
    schemaFamily: "CONTENT_PAGE",
    publicHref: ROUTES.PRIVACY,
  },
  {
    topic: "terms",
    label: "Terms of Service",
    description: "Terms, acceptable use, AI review guidance, and legal CTA content.",
    configKey: SYSTEM_CONFIGURATION_KEYS.TOS_INFORMATION,
    schemaFamily: "CONTENT_PAGE",
    publicHref: ROUTES.TERMS,
  },
] as const satisfies readonly AdminContentTopicMetadata[];

const TOPIC_METADATA_BY_TOPIC = new Map<PublicContentTopic, AdminContentTopicMetadata>(
  ADMIN_CONTENT_TOPICS.map((entry) => [entry.topic, entry]),
);

const TOPIC_METADATA_BY_CONFIG_KEY = new Map<string, AdminContentTopicMetadata>(
  ADMIN_CONTENT_TOPICS.map((entry) => [entry.configKey, entry]),
);

export function getAdminContentTopicMetadata(topic: PublicContentTopic): AdminContentTopicMetadata {
  const metadata = TOPIC_METADATA_BY_TOPIC.get(topic);

  if (!metadata) {
    throw new Error(`Unknown admin content topic: ${topic}`);
  }

  return metadata;
}

export function getAdminContentTopicMetadataByConfigKey(configKey: string): AdminContentTopicMetadata | null {
  return TOPIC_METADATA_BY_CONFIG_KEY.get(configKey) ?? null;
}

export function getAdminContentConfigEntries(
  response: SystemConfigurationListResponse,
): Array<SystemConfigurationEntry & { metadata: AdminContentTopicMetadata }> {
  return response.items.flatMap((item) => {
    const metadata = getAdminContentTopicMetadataByConfigKey(item.name);

    return metadata ? [{ ...item, metadata }] : [];
  });
}
