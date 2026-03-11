import type { OpenRouterModelOption } from "./openrouter-model-service";
import type { ActiveAiModel, AiUsageMetrics } from "./types";

type ChatUsage = {
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  completionTokensDetails?: {
    reasoningTokens?: number | null;
  } | null;
};

type ModelUsage = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  outputTokensDetails?: {
    reasoningTokens?: number | null;
  };
};

export type OpenRouterStreamChunk = {
  choices?: Array<{ delta?: { content?: string | null } }>;
  usage?: ChatUsage;
};

export function emptyAiUsageMetrics(): AiUsageMetrics {
  return {
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
    reasoningTokens: null,
  };
}

export function mapOpenRouterModelToActiveAiModel(model: OpenRouterModelOption): ActiveAiModel {
  return {
    id: model.id,
    name: model.name,
    contextLength: model.contextLength,
    inputModalities: model.inputModalities,
    outputModalities: model.outputModalities,
    supportedParameters: model.supportedParameters,
  };
}

export function toChatUsageMetrics(usage?: ChatUsage | null): AiUsageMetrics {
  if (!usage) {
    return emptyAiUsageMetrics();
  }

  return {
    promptTokens: usage.promptTokens ?? null,
    completionTokens: usage.completionTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
    reasoningTokens: usage.completionTokensDetails?.reasoningTokens ?? null,
  };
}

export function toModelUsageMetrics(usage?: ModelUsage | null): AiUsageMetrics {
  if (!usage) {
    return emptyAiUsageMetrics();
  }

  const promptTokens = usage.inputTokens ?? null;
  const completionTokens = usage.outputTokens ?? null;

  return {
    promptTokens,
    completionTokens,
    totalTokens:
      typeof promptTokens === "number" && typeof completionTokens === "number" ? promptTokens + completionTokens : null,
    reasoningTokens: usage.outputTokensDetails?.reasoningTokens ?? null,
  };
}
