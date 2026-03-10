import { ASSISTANT_ACCESS_DENIED_REPLY, ASSISTANT_SAFE_RETRIEVAL_REPLY, ASSISTANT_SIGN_IN_REPLY } from "../constants";
import { renderToolEnvelopeReply } from "../rendering";
import { buildRequestContext } from "../request-context";
import { assistantToolEnvelopeSchema, createAssistantTools } from "../tools";
import type { AssistantAgentContext, AssistantAgentRunOptions, AssistantToolName } from "../types";

function buildAssistantToolInput(requestedLimit: number | null): {
  limit?: number;
} {
  return requestedLimit ? { limit: requestedLimit } : {};
}

export async function executeAssistantTool(
  options: AssistantAgentRunOptions,
  toolName: AssistantToolName,
  requestedLimit: number | null,
): Promise<{ reply: string; toolNames: string[] }> {
  const toolContext = buildRequestContext(options, requestedLimit).all as AssistantAgentContext;
  const tool = createAssistantTools(toolContext)[toolName];

  if (!tool.execute) {
    return {
      reply: ASSISTANT_SAFE_RETRIEVAL_REPLY,
      toolNames: [toolName],
    };
  }

  try {
    const result = await tool.execute(buildAssistantToolInput(requestedLimit) as never, {} as never);
    const parsedResult = assistantToolEnvelopeSchema.safeParse(result);

    if (!parsedResult.success) {
      return {
        reply: ASSISTANT_SAFE_RETRIEVAL_REPLY,
        toolNames: [toolName],
      };
    }

    return {
      reply: renderToolEnvelopeReply(parsedResult.data),
      toolNames: [toolName],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (message === ASSISTANT_ACCESS_DENIED_REPLY || message === ASSISTANT_SIGN_IN_REPLY) {
      return {
        reply: message,
        toolNames: [toolName],
      };
    }

    return {
      reply: ASSISTANT_SAFE_RETRIEVAL_REPLY,
      toolNames: [toolName],
    };
  }
}
