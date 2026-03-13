import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { AiConfiguration } from "@rezumerai/types";
import { embed, embedMany } from "ai";
import { createAiProviderRegistry, ensureEmbeddingDimension, ProviderConfigurationError } from "../providers/registry";

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 120;
const embeddingDimensionCache = new Map<string, Promise<number>>();

function getEmbeddingCacheKey(config: AiConfiguration): string {
  return `${config.EMBEDDING_PROVIDER}:${config.EMBEDDING_MODEL}:${config.EMBEDDING_DIMENSIONS}`;
}

function getTextSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: DEFAULT_CHUNK_SIZE,
    chunkOverlap: DEFAULT_CHUNK_OVERLAP,
  });
}

async function splitEmbeddingInput(value: string): Promise<string[]> {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return [];
  }

  const chunks = await getTextSplitter().splitText(normalizedValue);
  const normalizedChunks = chunks.map((chunk) => chunk.trim()).filter((chunk) => chunk.length > 0);

  return normalizedChunks.length > 0 ? normalizedChunks : [normalizedValue];
}

function averageEmbeddings(vectors: number[][], dimension: number): number[] {
  if (vectors.length === 0) {
    throw new ProviderConfigurationError("Cannot average embeddings from an empty vector set.");
  }

  const sums = new Array<number>(dimension).fill(0);

  for (const vector of vectors) {
    if (vector.length !== dimension) {
      throw new ProviderConfigurationError(
        `Embedding dimension mismatch. Expected ${dimension}, received ${vector.length}.`,
      );
    }

    for (let index = 0; index < dimension; index += 1) {
      sums[index] = (sums[index] ?? 0) + (vector[index] ?? 0);
    }
  }

  return sums.map((value) => value / vectors.length);
}

export async function ensureAssistantEmbeddingDimension(config: AiConfiguration): Promise<number> {
  const cacheKey = getEmbeddingCacheKey(config);
  const cachedDimension = embeddingDimensionCache.get(cacheKey);

  if (cachedDimension) {
    return cachedDimension;
  }

  const dimensionPromise = (async () => {
    const registry = createAiProviderRegistry();
    const result = await embed({
      model: registry.getEmbeddingModel(config),
      value: "assistant-dimension-probe",
    });

    return ensureEmbeddingDimension({
      configuredDimension: config.EMBEDDING_DIMENSIONS,
      embeddings: [result.embedding],
    });
  })();

  embeddingDimensionCache.set(cacheKey, dimensionPromise);
  return dimensionPromise;
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

  const chunkGroups = await Promise.all(values.map((value) => splitEmbeddingInput(value)));
  const flattenedChunks = chunkGroups.flat();

  if (flattenedChunks.length === 0) {
    return {
      embeddings: [],
      dimension: config.EMBEDDING_DIMENSIONS,
    };
  }

  const registry = createAiProviderRegistry();
  const result = await embedMany({
    model: registry.getEmbeddingModel(config),
    values: flattenedChunks,
  });
  const dimension = ensureEmbeddingDimension({
    configuredDimension: config.EMBEDDING_DIMENSIONS,
    embeddings: result.embeddings,
  });

  let currentIndex = 0;
  const averagedEmbeddings = chunkGroups.map((chunks) => {
    const chunkVectors = result.embeddings.slice(currentIndex, currentIndex + chunks.length);
    currentIndex += chunks.length;

    if (chunkVectors.length === 0) {
      throw new ProviderConfigurationError("Missing embedding vectors for a chunked assistant message.");
    }

    return averageEmbeddings(chunkVectors, dimension);
  });

  return {
    embeddings: averagedEmbeddings,
    dimension,
  };
}
