import { ERROR_MESSAGES } from "@/constants/errors";
import { assistantTextAgent } from "./agent";
import { executeAssistantTool, resolveAssistantExecutionStrategy } from "./execution";
import { buildRequestContext } from "./request-context";
import type { AssistantAgentRunOptions, AssistantRunDependencies } from "./types";

function toMastraMessageInput(history: AssistantAgentRunOptions["history"]): string[] {
  return history.map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`);
}

export async function runMastraAssistantChat(
  options: AssistantAgentRunOptions,
  dependencies?: AssistantRunDependencies,
): Promise<{ reply: string; toolNames: string[] }> {
  const strategy = resolveAssistantExecutionStrategy({
    message: options.latestUserMessage,
    scope: options.scope,
    userId: options.userId,
  });

  if (strategy.mode === "sign-in-required" || strategy.mode === "access-denied") {
    return {
      reply: strategy.reply,
      toolNames: [],
    };
  }

  if (strategy.mode === "forced-tool") {
    return executeAssistantTool(options, strategy.toolName, strategy.requestedLimit);
  }

  const requestContext = buildRequestContext(options, strategy.requestedLimit);

  const generate =
    dependencies?.generate ??
    (async (messages, agentOptions) => {
      const result = await assistantTextAgent.generate(toMastraMessageInput(messages), agentOptions);

      return {
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };
    });

  const generation = await generate(options.history, {
    requestContext,
    maxSteps: 1,
    modelSettings: {
      temperature: 0,
    },
  });

  const toolNames = generation.toolCalls.map((toolCall) => toolCall.payload.toolName);
  const text = generation.text.trim();

  return {
    reply: text.length > 0 ? text : ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
    toolNames,
  };
}
