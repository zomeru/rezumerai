import { describe, expect, it } from "bun:test";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";
import type { EmbeddingProvider } from "../embeddings/provider";
import { EmbeddingConfigurationError, EmbeddingService } from "../embeddings/service";

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
        EMBEDDING_MODEL: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
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
