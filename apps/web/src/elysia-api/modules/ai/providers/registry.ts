import type { AiConfiguration } from "@rezumerai/types";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { EmbeddingModel, LanguageModel } from "ai";

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

type OpenRouterLike = {
  chat: (modelId: string, settings?: unknown) => LanguageModel;
  textEmbeddingModel: (modelId: string, settings?: unknown) => EmbeddingModel;
};

interface CreateAiProviderRegistryOptions {
  apiKey?: string;
  appName?: string;
  siteUrl?: string;
  createOpenRouter?: (options: {
    apiKey: string;
    headers: Record<string, string>;
    compatibility: "strict";
  }) => OpenRouterLike;
}

export function createAiProviderRegistry(options: CreateAiProviderRegistryOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";

  if (!apiKey.trim()) {
    throw new ProviderConfigurationError("OpenRouter API key is required for the AI runtime.");
  }

  const provider = (options.createOpenRouter ?? createOpenRouter)({
    apiKey,
    compatibility: "strict",
    headers: {
      "HTTP-Referer": options.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": options.appName ?? "Rezumerai",
    },
  });

  return {
    getChatModel(modelId: string) {
      return provider.chat(modelId);
    },
    getEmbeddingModel(config: Pick<AiConfiguration, "EMBEDDING_MODEL">) {
      return provider.textEmbeddingModel(config.EMBEDDING_MODEL);
    },
  };
}

export function ensureEmbeddingDimension(options: { configuredDimension: number; embeddings: number[][] }): number {
  const dimension = options.embeddings[0]?.length ?? 0;

  if (dimension !== options.configuredDimension) {
    throw new ProviderConfigurationError(
      `Embedding dimension mismatch. Expected ${options.configuredDimension}, received ${dimension}.`,
    );
  }

  return options.configuredDimension;
}
