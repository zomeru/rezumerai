import type { AssistantRoleScope } from "@rezumerai/types";

export type AiPromptWorkflow =
  | {
      feature: "assistant";
      action: "chat";
    }
  | {
      feature: "resume-copilot";
      action: "optimize" | "tailor" | "review";
    };

interface ComposeAiSystemPromptOptions {
  baseSystemPrompt: string;
  currentPath?: string;
  workflow: AiPromptWorkflow;
  memoryContext?: string | null;
  ragContext?: string | null;
  scope: AssistantRoleScope;
  toolNames: string[];
}

const WORKFLOW_RULES = {
  "assistant:chat":
    "Flow=assistant. Use prior messages from the same thread to answer follow-up questions and questions about earlier messages. Use tools whenever the user asks about Rezumerai product data, account data, resume data, credits, or admin data. After using tools, respond with a natural-language answer for the user. Do not guess tool-backed facts.",
  "resume-copilot:optimize": "Return only the requested structured result.",
  "resume-copilot:tailor": "Return only the requested structured result.",
  "resume-copilot:review": "Return only the requested structured result.",
} as const;

function getWorkflowKey(workflow: AiPromptWorkflow): keyof typeof WORKFLOW_RULES {
  return `${workflow.feature}:${workflow.action}` as keyof typeof WORKFLOW_RULES;
}

export function composeAiSystemPrompt(options: ComposeAiSystemPromptOptions): string {
  const workflowKey = getWorkflowKey(options.workflow);
  const sections = [
    options.baseSystemPrompt.trim(),
    `Feature=${options.workflow.feature}.`,
    `Action=${options.workflow.action}.`,
    `Scope=${options.scope}.`,
    WORKFLOW_RULES[workflowKey],
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
