import type { MastraEmbeddingModel } from "@mastra/core/vector";
import type { AiConfiguration } from "@rezumerai/types";
import { EmbeddingConfigurationError, EmbeddingService } from "../embeddings/service";

class OpenRouterMastraEmbeddingModel {
  readonly specificationVersion = "v2" as const;
  readonly provider = "openrouter";
  readonly maxEmbeddingsPerCall = 16;
  readonly supportsParallelCalls = true;

  constructor(
    readonly modelId: string,
    private readonly config: AiConfiguration,
  ) {}

  async doEmbed(options: {
    values: string[];
    abortSignal?: AbortSignal;
    providerOptions?: Record<string, unknown>;
    headers?: Record<string, string | undefined>;
  }): Promise<{ embeddings: number[][]; usage?: { tokens: number } }> {
    const provider = EmbeddingService.createProvider(this.config);
    const embeddings = await provider.embedBatch(options.values);

    const invalidEmbedding = embeddings.find((embedding) => embedding.length !== this.config.EMBEDDING_DIMENSIONS);

    if (invalidEmbedding) {
      throw new EmbeddingConfigurationError(
        `Configured embedding dimension ${this.config.EMBEDDING_DIMENSIONS} does not match provider output ${invalidEmbedding.length}.`,
      );
    }

    return { embeddings };
  }
}

const embeddingDimensionCache = new Map<string, Promise<number>>();

function getEmbeddingCacheKey(config: AiConfiguration): string {
  return `${config.EMBEDDING_PROVIDER}:${config.EMBEDDING_MODEL}:${config.EMBEDDING_DIMENSIONS}`;
}

export function createAssistantEmbeddingModel(config: AiConfiguration): MastraEmbeddingModel<string> {
  return new OpenRouterMastraEmbeddingModel(config.EMBEDDING_MODEL, config);
}

export async function ensureAssistantEmbeddingDimension(config: AiConfiguration): Promise<number> {
  const cacheKey = getEmbeddingCacheKey(config);
  const cached = embeddingDimensionCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const probe = (async () => {
    const provider = EmbeddingService.createProvider(config);
    const embedding = await provider.embed("assistant-dimension-probe");

    if (embedding.length !== config.EMBEDDING_DIMENSIONS) {
      throw new EmbeddingConfigurationError(
        `Configured embedding dimension ${config.EMBEDDING_DIMENSIONS} does not match provider output ${embedding.length}.`,
      );
    }

    return embedding.length;
  })();

  embeddingDimensionCache.set(cacheKey, probe);
  return probe;
}

export async function embedAssistantTexts(
  config: AiConfiguration,
  values: string[],
): Promise<{ embeddings: number[][]; dimension: number }> {
  if (values.length === 0) {
    return {
      embeddings: [],
      dimension: config.EMBEDDING_DIMENSIONS,
    };
  }

  const embedder = createAssistantEmbeddingModel(config) as OpenRouterMastraEmbeddingModel;
  const result = await embedder.doEmbed({ values });

  return {
    embeddings: result.embeddings,
    dimension: result.embeddings[0]?.length ?? config.EMBEDDING_DIMENSIONS,
  };
}

export function resolveAssistantVectorType(dimension: number): "halfvec" | "vector" {
  return dimension > 2_000 ? "halfvec" : "vector";
}
