import { tool } from "@openrouter/sdk";
import { PublicContentTopicSchema } from "@rezumerai/types";
import { z } from "zod";
import { getPublicAppContent, searchPublicFaq } from "@/lib/system-content";
import { createToolCollectionResult, createToolDetailResult, searchSchema } from "../shared";
import type { DatabaseClient } from "../types";

export function createPublicAssistantTools(options: { db: DatabaseClient }) {
  const { db } = options;

  return [
    tool({
      name: "getPublicAppContent",
      description: "Read public app content.",
      inputSchema: z.object({
        topic: PublicContentTopicSchema,
      }),
      execute: async ({ topic }) =>
        createToolDetailResult("public_content", await getPublicAppContent(topic, db), `Public content for ${topic}.`),
    }),
    tool({
      name: "searchPublicFaq",
      description: "Search public FAQ.",
      inputSchema: searchSchema,
      execute: async ({ query }) =>
        createToolCollectionResult("faq_entry", await searchPublicFaq(query, db), `FAQ matches for "${query}".`, {
          query,
        }),
    }),
  ] as const;
}
