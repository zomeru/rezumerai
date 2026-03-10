import { EmbeddingConfigurationError, type EmbeddingProvider } from "./provider";

interface OpenRouterEmbeddingsResponse {
  data?: Array<{
    embedding?: number[];
  }>;
}

export interface OpenRouterEmbeddingProviderOptions {
  modelId: string;
  dimensions: number;
  apiKey?: string;
  fetchImplementation?: typeof fetch;
}

export class OpenRouterEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly dimensions: number;
  private readonly fetchImplementation: typeof fetch;
  private readonly modelId: string;

  constructor(options: OpenRouterEmbeddingProviderOptions) {
    this.apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.dimensions = options.dimensions;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.modelId = options.modelId;

    if (!this.apiKey) {
      throw new EmbeddingConfigurationError("Missing OpenRouter API key for embedding generation.");
    }
  }

  async embed(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text]);

    if (!embedding) {
      throw new EmbeddingConfigurationError("Embedding provider returned no vectors.");
    }

    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.fetchImplementation("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelId,
        input: texts,
        dimensions: this.dimensions,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new EmbeddingConfigurationError(
        `OpenRouter embedding request failed with status ${response.status}: ${body || "unknown error"}`,
      );
    }

    const payload = (await response.json()) as OpenRouterEmbeddingsResponse;
    const embeddings = payload.data?.map((item) => item.embedding ?? []) ?? [];

    if (embeddings.length !== texts.length || embeddings.some((embedding) => embedding.length === 0)) {
      throw new EmbeddingConfigurationError("OpenRouter embedding response did not contain one vector per input.");
    }

    return embeddings;
  }
}
