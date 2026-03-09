import { describe, expect, it } from "bun:test";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";
import { EmbeddingConfigurationError, EmbeddingService } from "../embeddings/service";
import type { EmbeddingProvider } from "../embeddings/provider";

describe("EmbeddingService.createProvider", () => {
  it("resolves the configured embedding provider independently from chat models", () => {
    const provider: EmbeddingProvider = {
      embed: async () => [0.1, 0.2],
      embedBatch: async () => [[0.1, 0.2]],
    };

    const resolved = EmbeddingService.createProvider(
      {
        ...DEFAULT_AI_CONFIGURATION,
        EMBEDDING_PROVIDER: "openrouter",
        EMBEDDING_MODEL: "openai/text-embedding-3-small",
      },
      {
        createOpenRouterProvider: () => provider,
      },
    );

    expect(resolved).toBe(provider);
  });

  it("throws a typed error for unsupported embedding providers", () => {
    expect(() =>
      EmbeddingService.createProvider({
        ...DEFAULT_AI_CONFIGURATION,
        EMBEDDING_PROVIDER: "unsupported",
        EMBEDDING_MODEL: "example/model",
      }),
    ).toThrow(EmbeddingConfigurationError);
  });
});
