import { Agent } from "@mastra/core/agent";
import type { RequestContext } from "@mastra/core/request-context";
import { ASSISTANT_SAFE_RETRIEVAL_REPLY } from "./constants";
import { assistantRequestContextSchema } from "./request-context";
import type { AssistantAgentContext } from "./types";

function buildAssistantInstructions(requestContext: RequestContext<AssistantAgentContext>): string {
  const scope = requestContext.get("scope");
  const currentPath = requestContext.get("currentPath");
  const systemPrompt = requestContext.get("systemPrompt");
  const latestUserMessage = requestContext.get("latestUserMessage");
  const pathInstruction = currentPath ? ` CurrentPage=${currentPath}.` : "";

  return [
    systemPrompt,
    `Scope=${scope}.${pathInstruction}`,
    "Never fabricate database records or system data.",
    "If a relevant application tool exists for requested information, you must not guess or invent the answer.",
    `If a database-backed or system-backed answer is unavailable, reply exactly: "${ASSISTANT_SAFE_RETRIEVAL_REPLY}"`,
    "Never invent users, resumes, system configuration, analytics, audit logs, error logs, or account data.",
    "For greetings or normal product questions, answer briefly and naturally.",
    "Do not echo raw field names, database keys, or JSON-style labels in user-facing replies.",
    "Transform structured data into short paragraphs, readable sections, and bullet lists when helpful.",
    `LatestUserMessage=${latestUserMessage}`,
  ].join(" ");
}

function toMastraOpenRouterModelId(modelId: string): string {
  return modelId.startsWith("openrouter/") ? modelId : `openrouter/${modelId}`;
}

export const assistantTextAgent = new Agent({
  id: "rezumerai-assistant",
  name: "Rezumerai Assistant",
  requestContextSchema: assistantRequestContextSchema,
  model: ({ requestContext }) => toMastraOpenRouterModelId(requestContext.get("modelId")),
  instructions: ({ requestContext }) =>
    buildAssistantInstructions(requestContext as RequestContext<AssistantAgentContext>),
});
