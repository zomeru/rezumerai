import { ERROR_MESSAGES } from "@/constants/errors";
import { assistantTextAgent } from "./agent";
import { executeAssistantTool, resolveAssistantExecutionStrategy } from "./execution";
import { buildRequestContext } from "./request-context";
import type { AssistantAgentRunOptions, AssistantRunDependencies } from "./types";

export async function runMastraAssistantChat(
  options: AssistantAgentRunOptions,
  dependencies?: AssistantRunDependencies,
): Promise<{ persistedByMemory: boolean; reply: string; toolNames: string[]; usedMemory: boolean }> {
  const strategy = resolveAssistantExecutionStrategy({
    message: options.latestUserMessage,
    scope: options.scope,
    userId: options.userId,
  });

  if (strategy.mode === "sign-in-required" || strategy.mode === "access-denied") {
    return {
      persistedByMemory: false,
      reply: strategy.reply,
      toolNames: [],
      usedMemory: false,
    };
  }

  if (strategy.mode === "forced-tool") {
    const result = await executeAssistantTool(options, strategy.toolName, strategy.requestedLimit);

    return {
      ...result,
      persistedByMemory: false,
      usedMemory: false,
    };
  }

  const requestContext = buildRequestContext(options, strategy.requestedLimit);

  const generate =
    dependencies?.generate ??
    (async (messages, agentOptions) => {
      const result = await assistantTextAgent.generate(messages, agentOptions);

      return {
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };
    });

  const generation = await generate(options.latestUserMessage, {
    context: options.contextMessages,
    requestContext,
    maxSteps: 1,
    memory: {
      thread: { id: options.threadId },
      resource: options.resourceId,
      options: options.memoryOptions,
    },
    modelSettings: {
      temperature: 0,
    },
  });

  const toolNames = generation.toolCalls.map((toolCall) => toolCall.payload.toolName);
  const text = generation.text.trim();

  return {
    persistedByMemory: true,
    reply: text.length > 0 ? text : ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
    toolNames,
    usedMemory: true,
  };
}
