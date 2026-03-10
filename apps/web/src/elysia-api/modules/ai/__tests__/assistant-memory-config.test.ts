import { describe, expect, it } from "bun:test";
import { buildAssistantMemoryConfig } from "../memory/config";

describe("assistant memory config", () => {
  it("uses flat semantic recall indexes for embeddings above 2000 dimensions", () => {
    const config = buildAssistantMemoryConfig({
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

    expect(config.semanticRecall).toMatchObject({
      indexConfig: {
        type: "flat",
        metric: "cosine",
      },
    });
  });
});
