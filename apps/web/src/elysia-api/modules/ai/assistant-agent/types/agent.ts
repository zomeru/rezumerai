import type { RequestContext } from "@mastra/core/request-context";
import type { AiConfiguration, AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";
import type { DatabaseClient } from "./tooling";

export interface AssistantAgentContext {
  currentPath?: string;
  db: DatabaseClient;
  getAiConfiguration: () => Promise<AiConfiguration>;
  getCurrentModelSettings: () => Promise<{
    models: string[];
    selectedModelId: string;
  } | null>;
  getOptimizationCredits: () => Promise<{
    dailyLimit: number;
    remainingCredits: number;
  } | null>;
  latestUserMessage: string;
  modelId: string;
  requestedLimit: number | null;
  scope: AssistantRoleScope;
  systemPrompt: string;
  userId: string | null;
}

export interface AssistantAgentRunOptions {
  currentPath?: string;
  db: DatabaseClient;
  getAiConfiguration: () => Promise<AiConfiguration>;
  getCurrentModelSettings: () => Promise<{
    models: string[];
    selectedModelId: string;
  } | null>;
  getOptimizationCredits: () => Promise<{
    dailyLimit: number;
    remainingCredits: number;
  } | null>;
  history: AssistantChatMessage[];
  latestUserMessage: string;
  maxSteps: number;
  modelId: string;
  scope: AssistantRoleScope;
  systemPrompt: string;
  userId: string | null;
}

export interface AssistantGenerateOutput {
  text: string;
  toolCalls: Array<{ payload: { toolName: string } }>;
  toolResults: Array<{ payload: { isError?: boolean; result: unknown; toolName: string } }>;
}

export interface AssistantRunDependencies {
  generate?: (
    messages: AssistantChatMessage[],
    options: {
      maxSteps: number;
      modelSettings?: {
        temperature?: number;
      };
      requestContext: RequestContext<AssistantAgentContext>;
    },
  ) => Promise<AssistantGenerateOutput>;
}
