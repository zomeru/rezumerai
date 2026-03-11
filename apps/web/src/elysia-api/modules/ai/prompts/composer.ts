import type { AssistantRoleScope } from "@rezumerai/types";

type AiPromptFlow = "assistant" | "copilot-optimize" | "copilot-tailor" | "copilot-review";

interface ComposeAiSystemPromptOptions {
  baseSystemPrompt: string;
  currentPath?: string;
  flow: AiPromptFlow;
  memoryContext?: string | null;
  ragContext?: string | null;
  scope: AssistantRoleScope;
  toolNames: string[];
}

const FLOW_RULES: Record<AiPromptFlow, string> = {
  assistant:
    "Flow=assistant. Use prior messages from the same thread to answer follow-up questions and questions about earlier messages. Use tools whenever the user asks about Rezumerai product data, account data, resume data, credits, or admin data. After using tools, respond with a natural-language answer for the user. Do not guess tool-backed facts.",
  "copilot-optimize":
    "Flow=copilot-optimize. Improve the requested resume content without changing facts. Return only the requested structured result.",
  "copilot-tailor":
    "Flow=copilot-tailor. Compare the resume against the job description. Return only the requested structured result.",
  "copilot-review":
    "Flow=copilot-review. Review the resume critically. Return only the requested structured result.",
};

export function composeAiSystemPrompt(options: ComposeAiSystemPromptOptions): string {
  const sections = [
    options.baseSystemPrompt.trim(),
    `Scope=${options.scope}.`,
    FLOW_RULES[options.flow],
    options.currentPath ? `CurrentPage=${options.currentPath}.` : null,
    options.toolNames.length > 0
      ? `AvailableTools=${options.toolNames.join(", ")}. Use only these tools and prefer them over guessing tool-backed data.`
      : "AvailableTools=none.",
    options.ragContext ? `RAGContext:\n${options.ragContext.trim()}` : null,
    options.memoryContext ? `ConversationMemory:\n${options.memoryContext.trim()}` : null,
    "Keep the reply concise. Never expose raw JSON or tool payloads. Never expose raw database field names or internal implementation details.",
  ];

  return sections.filter(Boolean).join("\n\n");
}
