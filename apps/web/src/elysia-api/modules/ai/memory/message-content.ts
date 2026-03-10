import type { MastraDBMessage } from "@mastra/core/agent";

export function createAssistantTextMessage(options: {
  role: "assistant" | "user";
  content: string;
  createdAt?: Date;
  resourceId: string;
  threadId: string;
}): MastraDBMessage {
  return {
    id: crypto.randomUUID(),
    role: options.role,
    createdAt: options.createdAt ?? new Date(),
    threadId: options.threadId,
    resourceId: options.resourceId,
    content: {
      format: 2,
      parts: [
        {
          type: "text",
          text: options.content,
        },
      ],
    },
  };
}

export function extractAssistantMessageText(message: MastraDBMessage): string {
  const textParts = message.content.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text.trim())
    .filter(Boolean);

  return textParts.join("\n\n").trim();
}
