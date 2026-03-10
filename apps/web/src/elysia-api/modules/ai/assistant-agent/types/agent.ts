import type { MemoryConfig } from "@mastra/core/memory";
import type { RequestContext } from "@mastra/core/request-context";
import type { AiConfiguration, AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";
import type { DatabaseClient } from "./tooling";

export interface AssistantContextMessage {
  content: string;
  role: "system";
}

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
  resourceId: string;
  scope: AssistantRoleScope;
  systemPrompt: string;
  threadId: string;
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
  memoryOptions: MemoryConfig;
  maxSteps: number;
  modelId: string;
  resourceId: string;
  scope: AssistantRoleScope;
  systemPrompt: string;
  threadId: string;
  userId: string | null;
  contextMessages?: AssistantContextMessage[];
}

export interface AssistantGenerateOutput {
  text: string;
  toolCalls: Array<{ payload: { toolName: string } }>;
  toolResults: Array<{ payload: { isError?: boolean; result: unknown; toolName: string } }>;
}

export interface AssistantRunDependencies {
  generate?: (
    messages: string,
    options: {
      context?: AssistantContextMessage[];
      maxSteps: number;
      memory: {
        options: MemoryConfig;
        resource: string;
        thread: { id: string };
      };
      modelSettings?: {
        temperature?: number;
      };
      requestContext: RequestContext<AssistantAgentContext>;
    },
  ) => Promise<AssistantGenerateOutput>;
}
