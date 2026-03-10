import type { MemoryConfig } from "@mastra/core/memory";
import type { AiConfiguration, AssistantRoleScope } from "@rezumerai/types";
import { z } from "zod";

const assistantWorkingMemorySchema = z.object({
  preferences: z
    .object({
      communicationStyle: z.string().trim().min(1).max(120).optional(),
      resumeStyle: z.string().trim().min(1).max(160).optional(),
      wordingStyle: z.string().trim().min(1).max(160).optional(),
      atsPreference: z.string().trim().min(1).max(160).optional(),
    })
    .optional(),
  resumeGoals: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  targetRoles: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  targetCompanies: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  constraints: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  currentFocus: z.string().trim().min(1).max(240).optional(),
});

const OBSERVATIONAL_MEMORY_MODEL = "openrouter/google/gemini-2.5-flash";

export function buildAssistantMemoryConfig(config: AiConfiguration): MemoryConfig {
  const semanticRecallIndexConfig =
    config.EMBEDDING_DIMENSIONS > 2_000
      ? {
          type: "flat" as const,
          metric: "cosine" as const,
        }
      : {
          type: "hnsw" as const,
          metric: "cosine" as const,
          hnsw: {
            m: 16,
            efConstruction: 64,
          },
        };

  return {
    lastMessages: Math.max(config.ASSISTANT_HISTORY_LIMIT, config.ASSISTANT_RAG_RECENT_LIMIT),
    semanticRecall: config.ASSISTANT_RAG_ENABLED
      ? {
          topK: config.ASSISTANT_RAG_TOP_K,
          messageRange: {
            before: 1,
            after: 1,
          },
          scope: "thread",
          indexConfig: semanticRecallIndexConfig,
        }
      : false,
    workingMemory: {
      enabled: true,
      scope: "resource",
      schema: assistantWorkingMemorySchema,
    },
    observationalMemory: {
      model: OBSERVATIONAL_MEMORY_MODEL,
      scope: "thread",
      observation: {
        messageTokens: Math.max(12_000, config.ASSISTANT_CONTEXT_TOKEN_LIMIT * 10),
        bufferTokens: false,
      },
      reflection: {
        observationTokens: 36_000,
      },
    },
  };
}

export function buildAssistantThreadMetadata(options: {
  scope: AssistantRoleScope;
  ownerKind: "admin" | "guest" | "user";
  ownerUserId: string;
}): Record<string, unknown> {
  return {
    assistantScope: options.scope,
    ownerKind: options.ownerKind,
    ownerUserId: options.ownerUserId,
    threadType: "assistant",
  };
}
