import { type Prisma, type PrismaClient, prisma } from "@rezumerai/database";
import {
  type ContentPage,
  ContentPageSchema,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_LANDING_PAGE_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_TERMS_CONTENT,
  type FaqInformation,
  FaqInformationSchema,
  type LandingPageInformation,
  LandingPageInformationSchema,
  type PublicContentTopic,
  PublicContentTopicSchema,
  SYSTEM_CONFIGURATION_KEYS,
} from "@rezumerai/types";

const PUBLIC_CONTENT_CONFIG = {
  landing: {
    key: SYSTEM_CONFIGURATION_KEYS.LANDING_PAGE_INFORMATION,
    schema: LandingPageInformationSchema,
    fallback: DEFAULT_LANDING_PAGE_CONTENT,
  },
  terms: {
    key: SYSTEM_CONFIGURATION_KEYS.TOS_INFORMATION,
    schema: ContentPageSchema,
    fallback: DEFAULT_TERMS_CONTENT,
  },
  privacy: {
    key: SYSTEM_CONFIGURATION_KEYS.PRIVACY_POLICY_INFORMATION,
    schema: ContentPageSchema,
    fallback: DEFAULT_PRIVACY_CONTENT,
  },
  faq: {
    key: SYSTEM_CONFIGURATION_KEYS.FAQ_INFORMATION,
    schema: FaqInformationSchema,
    fallback: DEFAULT_FAQ_CONTENT,
  },
  about: {
    key: SYSTEM_CONFIGURATION_KEYS.ABOUT_US_INFORMATION,
    schema: ContentPageSchema,
    fallback: DEFAULT_ABOUT_CONTENT,
  },
  contact: {
    key: SYSTEM_CONFIGURATION_KEYS.CONTACT_INFORMATION,
    schema: ContentPageSchema,
    fallback: DEFAULT_CONTACT_CONTENT,
  },
} as const;

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

async function readConfigurationValue<T>(
  db: DatabaseClient,
  name: string,
  schema: { safeParse: (value: Prisma.JsonValue) => { success: true; data: T } | { success: false } },
  fallback: T,
): Promise<T> {
  const configuration = await db.systemConfiguration.findUnique({
    where: { name },
    select: { value: true },
  });

  if (!configuration) {
    return fallback;
  }

  const parsed = schema.safeParse(configuration.value);
  return parsed.success ? parsed.data : fallback;
}

export function getPublicContentByTopic(topic: "landing", db?: DatabaseClient): Promise<LandingPageInformation>;
export function getPublicContentByTopic(topic: "faq", db?: DatabaseClient): Promise<FaqInformation>;
export function getPublicContentByTopic(
  topic: Exclude<PublicContentTopic, "landing" | "faq">,
  db?: DatabaseClient,
): Promise<ContentPage>;
export async function getPublicContentByTopic(
  topic: PublicContentTopic,
  db: DatabaseClient = prisma,
): Promise<LandingPageInformation | ContentPage | FaqInformation> {
  const parsedTopic = PublicContentTopicSchema.parse(topic);
  const entry = PUBLIC_CONTENT_CONFIG[parsedTopic];

  return readConfigurationValue(db, entry.key, entry.schema, entry.fallback);
}

export async function getLandingPageContent(db: DatabaseClient = prisma): Promise<LandingPageInformation> {
  return getPublicContentByTopic("landing", db);
}

export async function getContentPage(
  topic: Exclude<PublicContentTopic, "landing" | "faq">,
  db: DatabaseClient = prisma,
): Promise<ContentPage> {
  return getPublicContentByTopic(topic, db);
}

export async function getFaqInformation(db: DatabaseClient = prisma): Promise<FaqInformation> {
  return getPublicContentByTopic("faq", db);
}

export async function getPublicAppContent(
  topic: PublicContentTopic,
  db: DatabaseClient = prisma,
): Promise<{
  topic: PublicContentTopic;
  title: string;
  summary: string;
  sections: Array<{ heading: string; points: string[] }>;
}> {
  if (topic === "landing") {
    const landing = await getLandingPageContent(db);
    return {
      topic,
      title: landing.hero.title,
      summary: landing.hero.description,
      sections: [
        {
          heading: landing.featureSection.title,
          points: landing.featureSection.items.map((item) => `${item.title}: ${item.description}`),
        },
        {
          heading: landing.workflowSection.title,
          points: landing.workflowSection.items.map((item) => `${item.title}: ${item.description}`),
        },
      ],
    };
  }

  if (topic === "faq") {
    const faq = await getFaqInformation(db);
    return {
      topic,
      title: faq.title,
      summary: faq.summary,
      sections: faq.categories.map((category) => ({
        heading: category.title,
        points: category.items.map((item) => `${item.question}: ${item.answer}`),
      })),
    };
  }

  const page = await getContentPage(topic, db);
  return {
    topic,
    title: page.title,
    summary: page.summary,
    sections: page.sections.map((section) => ({
      heading: section.heading,
      points: [...section.paragraphs, ...section.bullets],
    })),
  };
}

export async function searchPublicFaq(
  query: string,
  db: DatabaseClient = prisma,
): Promise<Array<{ question: string; answer: string; category: string }>> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  const faq = await getFaqInformation(db);
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  return faq.categories
    .flatMap((category) =>
      category.items.map((item) => {
        const haystack = `${category.title} ${item.question} ${item.answer} ${item.tags.join(" ")}`.toLowerCase();
        const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);

        return {
          category: category.title,
          question: item.question,
          answer: item.answer,
          score,
        };
      }),
    )
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.question.localeCompare(b.question))
    .slice(0, 5)
    .map(({ category, question, answer }) => ({ category, question, answer }));
}

export function listConfiguredPublicTopics(): PublicContentTopic[] {
  return PublicContentTopicSchema.options.filter((topic) => topic in PUBLIC_CONTENT_CONFIG);
}
