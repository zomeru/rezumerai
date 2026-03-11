import type { Prisma } from "@rezumerai/database";
import type { UIMessage } from "ai";
import { extractDisplayTextFromUiMessageParts, toDisplaySafeUiMessageParts } from "@/lib/ai-message-parts";

export type AssistantUiMessage = UIMessage;

export function extractTextFromUiMessageParts(parts: AssistantUiMessage["parts"]): string {
  return extractDisplayTextFromUiMessageParts(parts);
}

export function collectToolNamesFromUiMessageParts(parts: AssistantUiMessage["parts"]): string[] {
  const toolNames = new Set<string>();

  for (const part of parts) {
    if (typeof part !== "object" || part === null || !("type" in part)) {
      continue;
    }

    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      toolNames.add(part.type.slice("tool-".length));
      continue;
    }

    if (part.type === "dynamic-tool" && "toolName" in part && typeof part.toolName === "string") {
      toolNames.add(part.toolName);
    }
  }

  return [...toolNames];
}

export function sanitizeUiMessageParts(options: { parts: AssistantUiMessage["parts"] }): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(toDisplaySafeUiMessageParts(options.parts))) as Prisma.InputJsonValue;
}

export function toUiMessageParts(options: {
  blocks?: unknown;
  content: string;
  role: AssistantUiMessage["role"];
}): AssistantUiMessage["parts"] {
  if (Array.isArray(options.blocks)) {
    const safeParts = toDisplaySafeUiMessageParts(options.blocks as AssistantUiMessage["parts"]);

    if (safeParts.length > 0) {
      return safeParts;
    }
  }

  if (options.role === "assistant" || options.role === "user") {
    return [{ type: "text", text: options.content }];
  }

  return [];
}
