import type { AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";

const PREVIOUS_QUESTION_PATTERN =
  /\b(previous question|last question|my previous message|my last message|what did i ask|what was my question|what was my previous message|what was my last message|what did i just ask)\b/i;
const PREVIOUS_REPLY_PATTERN =
  /\b(what did you just say|what did you say|your last answer|your previous answer|repeat what you said)\b/i;
const CONVERSATION_REFERENCE_PATTERN =
  /\b(previous|earlier|again|just said|you said|you showed|we discussed|conversation|chat|summari[sz]e|repeat|explain that)\b/i;

export function buildAssistantResourceId(options: {
  isAnonymous: boolean;
  role: "ADMIN" | "USER" | null;
  userId: string;
}): string {
  if (options.isAnonymous) {
    return `assistant:guest:${options.userId}`;
  }

  if (options.role === "ADMIN") {
    return `assistant:admin:${options.userId}`;
  }

  return `assistant:user:${options.userId}`;
}

export function resolveAssistantScope(
  role: "ADMIN" | "USER" | null | undefined,
  isAnonymous = false,
): AssistantRoleScope {
  if (isAnonymous) {
    return "PUBLIC";
  }

  if (role === "ADMIN") {
    return "ADMIN";
  }

  if (role === "USER") {
    return "USER";
  }

  return "PUBLIC";
}

export function buildAssistantScopedThreadId(options: { resourceId: string; threadId: string }): string {
  return `${options.resourceId}:${options.threadId}`;
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
  const latestHistoryMessage = history.at(-1) ?? null;
  const historyIncludesLatestUserTurn =
    latestHistoryMessage?.role === "user" && latestHistoryMessage.content === latestUserMessage;
  const previousMessages = historyIncludesLatestUserTurn ? history.slice(0, -1) : history;
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
