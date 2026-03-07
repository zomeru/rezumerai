import type { AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";

export const AI_ASSISTANT_SESSION_COOKIE_NAME = "rezumerai_ai_chat_session";
export const AI_ASSISTANT_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const PREVIOUS_QUESTION_PATTERN =
  /\b(previous question|last question|what did i ask|what was my question|what did i just ask)\b/i;
const PREVIOUS_REPLY_PATTERN =
  /\b(what did you just say|what did you say|your last answer|your previous answer|repeat what you said)\b/i;
const CONVERSATION_REFERENCE_PATTERN =
  /\b(previous|earlier|again|just said|you said|you showed|we discussed|conversation|chat|summari[sz]e|repeat|explain that)\b/i;

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");

    if (rawName !== name) {
      continue;
    }

    const rawValue = rawValueParts.join("=");
    return rawValue ? decodeCookieValue(rawValue) : null;
  }

  return null;
}

export function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: "Lax" | "Strict" | "None";
    secure?: boolean;
  } = {},
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  segments.push(`Path=${options.path ?? "/"}`);
  segments.push(`SameSite=${options.sameSite ?? "Lax"}`);

  if (options.httpOnly ?? true) {
    segments.push("HttpOnly");
  }

  if (options.secure) {
    segments.push("Secure");
  }

  return segments.join("; ");
}

export function buildAssistantSessionKey(options: {
  scope: AssistantRoleScope;
  userId: string | null;
  sessionId: string;
}): string {
  if (options.scope === "PUBLIC" || !options.userId) {
    return `public:${options.sessionId}`;
  }

  return `${options.scope.toLowerCase()}:${options.userId}:${options.sessionId}`;
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
