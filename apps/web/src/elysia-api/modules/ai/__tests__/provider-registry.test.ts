import { describe, expect, it, mock } from "bun:test";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";
import type { EmbeddingModel, LanguageModel } from "ai";
import { createAiProviderRegistry, ensureEmbeddingDimension, ProviderConfigurationError } from "../providers/registry";

describe("createAiProviderRegistry", () => {
  it("creates chat and embedding models independently from one OpenRouter provider factory", () => {
    const chatModel = {} as LanguageModel;
    const embeddingModel = {} as EmbeddingModel;
    const chat = mock(() => chatModel);
    const textEmbeddingModel = mock(() => embeddingModel);

    const registry = createAiProviderRegistry({
      apiKey: "test-openrouter-key",
      appName: "Rezumerai Test",
      siteUrl: "https://rezumerai.test",
      createOpenRouter: () =>
        ({
          chat,
          textEmbeddingModel,
        }) as never,
    });

    const resolvedChatModel = registry.getChatModel("openai/gpt-5-mini");
    const resolvedEmbeddingModel = registry.getEmbeddingModel({
      ...DEFAULT_AI_CONFIGURATION,
      EMBEDDING_MODEL: "openai/text-embedding-3-small",
    });

    expect(chat).toHaveBeenCalledWith("openai/gpt-5-mini");
    expect(textEmbeddingModel).toHaveBeenCalledWith("openai/text-embedding-3-small");
    expect(resolvedChatModel).toBe(chatModel);
    expect(resolvedEmbeddingModel).toBe(embeddingModel);
  });

  it("throws a typed error when the API key is missing", () => {
    expect(() =>
      createAiProviderRegistry({
        apiKey: "",
      }),
    ).toThrow(ProviderConfigurationError);
  });
});

describe("ensureEmbeddingDimension", () => {
  it("throws when the returned embedding dimension does not match the configured dimension", () => {
    expect(() =>
      ensureEmbeddingDimension({
        configuredDimension: 1536,
        embeddings: [[0.1, 0.2, 0.3]],
      }),
    ).toThrow(ProviderConfigurationError);
  });

  it("returns the configured dimension when the embedding size matches", () => {
    expect(
      ensureEmbeddingDimension({
        configuredDimension: 3,
        embeddings: [[0.1, 0.2, 0.3]],
      }),
    ).toBe(3);
  });
});
