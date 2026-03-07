import type { ActiveAiModel, AiUsageMetrics } from "./types";

type ActiveAiModelRow = {
  id: string;
  name: string;
  modelId: string;
  provider: {
    name: string;
  };
};

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

export function formatProviderName(providerName: string): string {
  return providerName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function toActiveAiModel(record: ActiveAiModelRow): ActiveAiModel {
  return {
    id: record.id,
    name: record.name,
    modelId: record.modelId,
    providerName: record.provider.name,
    providerDisplayName: formatProviderName(record.provider.name),
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
