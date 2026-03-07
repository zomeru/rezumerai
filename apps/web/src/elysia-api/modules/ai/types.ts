import type { AiConfiguration, AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";

export interface AiUsageMetrics {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
}

export interface StreamOptimizeTextOptions {
  onUsage?: (usage: AiUsageMetrics) => void;
}

export interface SaveOptimizationInput {
  userId: string;
  provider: string;
  model: string;
  promptVersion: string;
  resumeId?: string | null;
  inputText: string;
  optimizedText: string;
  status: "success" | "failed" | "aborted";
  durationMs: number;
  chunkCount: number;
  errorMessage?: string | null;
  usage: AiUsageMetrics;
}

export interface ConsumeDailyCreditResult {
  remainingCredits: number;
}

export interface DailyCreditsStatus {
  remainingCredits: number;
  dailyLimit: number;
}

export interface ActiveAiModel {
  id: string;
  name: string;
  modelId: string;
  providerName: string;
  providerDisplayName: string;
}

export interface UserAiSettings {
  models: ActiveAiModel[];
  selectedModelId: string;
}

export interface OptimizationContext {
  model: ActiveAiModel;
  config: AiConfiguration;
}

export interface StructuredModelResult<T> {
  data: T;
  usage: AiUsageMetrics;
  toolNames: string[];
}

export interface TextModelResult {
  text: string;
  usage: AiUsageMetrics;
  toolNames: string[];
}

export interface CopilotRunResult<T> {
  response: T;
  usage: AiUsageMetrics;
  promptVersion: string;
}

export interface AssistantConversationIdentity {
  userId: string | null;
  role: "ADMIN" | "USER" | null;
  sessionId: string;
}

export interface AssistantConversationState {
  conversationId: string | null;
  history: AssistantChatMessage[];
  persistenceAvailable: boolean;
  sessionKey: string;
}

export type AiModelInput = AssistantChatMessage[] | Array<{ role: "user" | "assistant"; content: string }>;

export interface AssistantConversationRecord {
  conversationId: string;
  sessionKey: string;
  scope: AssistantRoleScope;
  userId: string | null;
  history: AssistantChatMessage[];
}
