import type { ContentPageSchema, LandingPageInformation } from "@rezumerai/types";
import { z } from "zod";
import type {
  AssistantToolCollectionEnvelope,
  AssistantToolDetailEnvelope,
  AssistantToolMetricEnvelope,
} from "../types";

export const publicAppOverviewSchema = z.object({
  cta: z
    .object({
      href: z.string().trim().min(1).max(200),
      label: z.string().trim().min(1).max(80),
    })
    .nullable()
    .default(null),
  features: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(260),
        title: z.string().trim().min(1).max(120),
      }),
    )
    .min(1)
    .max(8),
  summary: z.string().trim().min(1).max(600),
  title: z.string().trim().min(1).max(220),
  trustBadges: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  workflow: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(260),
        title: z.string().trim().min(1).max(120),
      }),
    )
    .max(8)
    .default([]),
});

export const limitInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

const unknownRecordSchema = z.object({}).catchall(z.unknown());

export const assistantToolEnvelopeSchema = z.union([
  z.object({
    count: z.number().int().min(0),
    entity: z.string(),
    items: z.array(unknownRecordSchema),
    meta: unknownRecordSchema.nullable(),
    summary: z.string(),
    type: z.literal("collection"),
  }),
  z.object({
    entity: z.string(),
    item: unknownRecordSchema,
    summary: z.string(),
    type: z.literal("detail"),
  }),
  z.object({
    data: unknownRecordSchema,
    entity: z.string(),
    summary: z.string(),
    type: z.literal("metric"),
  }),
]);

export function createCollectionEnvelope(
  entity: string,
  items: Array<Record<string, unknown>>,
  summary: string,
  meta?: Record<string, unknown>,
): AssistantToolCollectionEnvelope {
  return {
    type: "collection",
    entity,
    summary,
    count: items.length,
    items,
    meta: meta ?? null,
  };
}

export function createDetailEnvelope(
  entity: string,
  item: Record<string, unknown>,
  summary: string,
): AssistantToolDetailEnvelope {
  return {
    type: "detail",
    entity,
    summary,
    item,
  };
}

export function createMetricEnvelope(
  entity: string,
  data: Record<string, unknown>,
  summary: string,
): AssistantToolMetricEnvelope {
  return {
    type: "metric",
    entity,
    summary,
    data,
  };
}

export function createContentPageEnvelope(
  entity: string,
  summary: string,
  page: z.infer<typeof ContentPageSchema>,
): AssistantToolDetailEnvelope {
  return createDetailEnvelope(entity, page, summary);
}

export function createPublicOverviewItem(landing: LandingPageInformation): z.infer<typeof publicAppOverviewSchema> {
  return {
    cta: {
      href: landing.ctaSection.primaryCtaHref,
      label: landing.ctaSection.primaryCtaLabel,
    },
    features: landing.featureSection.items.map((item) => ({
      description: item.description,
      title: item.title,
    })),
    summary: landing.hero.description,
    title: landing.hero.title,
    trustBadges: landing.hero.trustBadges,
    workflow: landing.workflowSection.items.map((item) => ({
      description: item.description,
      title: item.title,
    })),
  };
}
