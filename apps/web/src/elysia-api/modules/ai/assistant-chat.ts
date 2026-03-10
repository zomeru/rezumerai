import type { AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";

const PREVIOUS_QUESTION_PATTERN =
  /\b(previous question|last question|what did i ask|what was my question|what did i just ask)\b/i;
const PREVIOUS_REPLY_PATTERN =
  /\b(what did you just say|what did you say|your last answer|your previous answer|repeat what you said)\b/i;
const CONVERSATION_REFERENCE_PATTERN =
  /\b(previous|earlier|again|just said|you said|you showed|we discussed|conversation|chat|summari[sz]e|repeat|explain that)\b/i;

export function buildIdentityThreadKey(options: { scope: AssistantRoleScope; userId: string | null }): string {
  if (options.userId) {
    return `user:${options.userId}:${options.scope}`;
  }

  throw new Error("Assistant thread identity requires a userId.");
}

export function buildAssistantThreadCursor(value: { createdAt: string; id: string }): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function parseAssistantThreadCursor(
  cursor: string | null | undefined,
): { createdAt: string; id: string } | null {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<{
      createdAt: string;
      id: string;
    }>;

    if (typeof decoded.createdAt !== "string" || typeof decoded.id !== "string") {
      return null;
    }

    return {
      createdAt: decoded.createdAt,
      id: decoded.id,
    };
  } catch {
    return null;
  }
}

export function getLatestUserMessage(messages: AssistantChatMessage[]): AssistantChatMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === "user") {
      return message;
    }
  }

  return null;
}

export function isConversationMemoryIntent(message: string): boolean {
  if (!message.trim()) {
    return false;
  }

  return CONVERSATION_REFERENCE_PATTERN.test(message);
}

export function buildDeterministicConversationReply(options: {
  history: AssistantChatMessage[];
  latestUserMessage: string;
}): string | null {
  const { history, latestUserMessage } = options;
  const previousMessages = history.slice(0, -1);
  const previousUserMessage = [...previousMessages].reverse().find((message) => message.role === "user");
  const previousAssistantMessage = [...previousMessages].reverse().find((message) => message.role === "assistant");

  if (PREVIOUS_QUESTION_PATTERN.test(latestUserMessage)) {
    if (!previousUserMessage) {
      return "You haven't asked an earlier question in this conversation yet.";
    }

    return `You previously asked: "${previousUserMessage.content}"`;
  }

  if (PREVIOUS_REPLY_PATTERN.test(latestUserMessage)) {
    if (!previousAssistantMessage) {
      return "I haven't given an earlier answer in this conversation yet.";
    }

    return `I just said:\n\n${previousAssistantMessage.content}`;
  }

  return null;
}
