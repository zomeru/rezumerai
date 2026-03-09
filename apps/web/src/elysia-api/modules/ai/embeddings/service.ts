import type { AiConfiguration } from "@rezumerai/types";
import { OpenRouterEmbeddingProvider } from "./openrouter-provider";
import { EmbeddingConfigurationError, type EmbeddingProvider } from "./provider";

interface EmbeddingProviderFactories {
  createOpenRouterProvider?: (config: AiConfiguration) => EmbeddingProvider;
}

const DEFAULT_EMBEDDING_BATCH_SIZE = 16;

// biome-ignore lint/complexity/noStaticOnlyClass: EmbeddingService centralizes provider resolution and batch helpers.
export abstract class EmbeddingService {
  static createProvider(config: AiConfiguration, factories: EmbeddingProviderFactories = {}): EmbeddingProvider {
    switch (config.EMBEDDING_PROVIDER) {
      case "openrouter":
        return (factories.createOpenRouterProvider ?? EmbeddingService.createOpenRouterProvider)(config);
      default:
        throw new EmbeddingConfigurationError(
          `Unsupported embedding provider "${config.EMBEDDING_PROVIDER}". Configure a supported provider before enabling RAG.`,
        );
    }
  }

  static async embedInBatches(options: {
    provider: EmbeddingProvider;
    texts: string[];
    batchSize?: number;
    onBatchComplete?: (details: { batchIndex: number; batchSize: number; durationMs: number }) => void;
  }): Promise<number[][]> {
    const batchSize = Math.max(1, options.batchSize ?? DEFAULT_EMBEDDING_BATCH_SIZE);
    const embeddings: number[][] = [];

    for (let index = 0; index < options.texts.length; index += batchSize) {
      const batch = options.texts.slice(index, index + batchSize);
      const startedAt = performance.now();
      const batchEmbeddings = await options.provider.embedBatch(batch);
      const durationMs = performance.now() - startedAt;

      options.onBatchComplete?.({
        batchIndex: Math.floor(index / batchSize),
        batchSize: batch.length,
        durationMs,
      });
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  private static createOpenRouterProvider(config: AiConfiguration): EmbeddingProvider {
    return new OpenRouterEmbeddingProvider({
      modelId: config.EMBEDDING_MODEL,
      dimensions: config.EMBEDDING_DIMENSIONS,
    });
  }
}

export { EmbeddingConfigurationError };
