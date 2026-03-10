import { Agent } from "@mastra/core/agent";
import type { RequestContext } from "@mastra/core/request-context";
// import { Memory } from "@mastra/memory";
import { ASSISTANT_SAFE_RETRIEVAL_REPLY } from "./constants";
import { assistantRequestContextSchema } from "./request-context";
import type { AssistantAgentContext } from "./types";

export function buildAssistantInstructions(requestContext: RequestContext<AssistantAgentContext>): string {
  const scope = requestContext.get("scope");
  const currentPath = requestContext.get("currentPath");
  const systemPrompt = requestContext.get("systemPrompt");

  const pathInstruction = currentPath ? `CurrentPage=${currentPath}.` : "";

  return [
    systemPrompt,
    `Scope=${scope}.`,
    pathInstruction,

    "Before answering, classify the request as one of the following:",
    "A. Rezumerai-specific data or account request",
    "B. General knowledge or normal product guidance",
    "C. Current or externally verifiable world fact",

    "Rules:",
    "1. Never fabricate Rezumerai application data such as accounts, resumes, users, analytics, audit logs, system configuration, or database records.",
    "2. If a request requires Rezumerai or account-specific information and an application tool exists, use the tool instead of guessing.",
    `3. If a request is clearly asking for Rezumerai or account-specific data but the data cannot be retrieved, reply exactly: "${ASSISTANT_SAFE_RETRIEVAL_REPLY}".`,
    "4. If the request is general knowledge or not related to Rezumerai data (for example: programming, careers, general advice, or how something works), answer normally and do not use the safe retrieval reply.",
    "5. For current or time-sensitive world facts (news, rankings, prices, or questions containing words like 'today', 'latest', or 'as of'), explain briefly that you cannot verify the latest information without web access.",
    "6. Do not expose raw database fields, JSON keys, or internal system identifiers in user-facing responses.",
    "7. When presenting structured data, convert it into clear paragraphs, short sections, or bullet lists for readability.",
  ]
    .filter(Boolean)
    .join("\n");
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
