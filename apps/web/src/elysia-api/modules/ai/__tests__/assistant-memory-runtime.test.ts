import { beforeEach, describe, expect, it, mock } from "bun:test";

const capturedMemoryConfigs: Array<Record<string, unknown>> = [];

mock.module("@/env", () => ({
  serverEnv: {
    DATABASE_URL: "postgresql://rezumerai:rezumerai@localhost:5432/rezumerai",
  },
}));

mock.module("@mastra/pg", () => ({
  PgVector: class PgVector {
    pool = {
      query: async () => ({ rows: [] as Array<Record<string, unknown>> }),
    };

    constructor(readonly config: Record<string, unknown>) {}

    async createIndex(): Promise<void> {}
  },
  PostgresStore: class PostgresStore {
    constructor(readonly config: Record<string, unknown>) {}

    async init(): Promise<void> {}
  },
}));

mock.module("@mastra/memory", () => ({
  Memory: class Memory {
    readonly embedder: unknown;
    readonly vector: unknown;

    constructor(readonly config: Record<string, unknown>) {
      capturedMemoryConfigs.push(config);
      const options = config.options as { semanticRecall?: boolean | Record<string, unknown> } | undefined;
      const semanticRecallEnabled = Boolean(options?.semanticRecall);

      this.vector = semanticRecallEnabled ? config.vector : undefined;
      this.embedder = semanticRecallEnabled ? config.embedder : undefined;
    }
  },
}));

const runtimeModule = await import("../memory/runtime");

describe("assistant memory runtime", () => {
  beforeEach(() => {
    capturedMemoryConfigs.length = 0;
    globalThis.__rezumeraiAssistantMemoryCache = undefined;
    globalThis.__rezumeraiAssistantPostgresStore = undefined;
    globalThis.__rezumeraiAssistantVectorStore = undefined;
    globalThis.__rezumeraiAssistantStorageInit = undefined;
  });

  it("attaches vector memory dependencies when semantic recall is enabled", () => {
    const memory = runtimeModule.getAssistantMemory({
      PROMPT_VERSION: "copilot-v1",
      DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
      ASSISTANT_MAX_STEPS: 4,
      ASSISTANT_HISTORY_LIMIT: 8,
      ASSISTANT_RAG_ENABLED: true,
      ASSISTANT_RAG_TOP_K: 4,
      ASSISTANT_RAG_RECENT_LIMIT: 8,
      ASSISTANT_CONTEXT_TOKEN_LIMIT: 1200,
      ASSISTANT_SYSTEM_PROMPT: "Assistant prompt",
      COPILOT_SYSTEM_PROMPT: "Copilot prompt",
      EMBEDDING_PROVIDER: "openrouter",
      EMBEDDING_MODEL: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
      EMBEDDING_DIMENSIONS: 2048,
      OPTIMIZE_SYSTEM_PROMPT: "Optimize prompt",
    });

    expect(capturedMemoryConfigs).toHaveLength(1);
    expect(capturedMemoryConfigs[0]?.options).toMatchObject({
      semanticRecall: expect.any(Object),
      workingMemory: expect.any(Object),
      observationalMemory: expect.any(Object),
    });
    expect(memory.vector).toBeDefined();
    expect(memory.embedder).toBeDefined();
  });

  it("recreates cached memory when assistant memory options change", () => {
    const baseConfig = {
      PROMPT_VERSION: "copilot-v1",
      DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
      ASSISTANT_MAX_STEPS: 4,
      ASSISTANT_HISTORY_LIMIT: 8,
      ASSISTANT_RAG_ENABLED: true,
      ASSISTANT_RAG_TOP_K: 4,
      ASSISTANT_RAG_RECENT_LIMIT: 8,
      ASSISTANT_CONTEXT_TOKEN_LIMIT: 1200,
      ASSISTANT_SYSTEM_PROMPT: "Assistant prompt",
      COPILOT_SYSTEM_PROMPT: "Copilot prompt",
      EMBEDDING_PROVIDER: "openrouter",
      EMBEDDING_MODEL: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
      EMBEDDING_DIMENSIONS: 2048,
      OPTIMIZE_SYSTEM_PROMPT: "Optimize prompt",
    } as const;

    const firstMemory = runtimeModule.getAssistantMemory(baseConfig);
    const secondMemory = runtimeModule.getAssistantMemory({
      ...baseConfig,
      ASSISTANT_RAG_TOP_K: 6,
    });

    expect(capturedMemoryConfigs).toHaveLength(2);
    expect(firstMemory).not.toBe(secondMemory);
    expect(capturedMemoryConfigs[0]?.options).toMatchObject({
      semanticRecall: {
        topK: 4,
      },
    });
    expect(capturedMemoryConfigs[1]?.options).toMatchObject({
      semanticRecall: {
        topK: 6,
      },
    });
  });
});
