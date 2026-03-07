import { describe, expect, it } from "bun:test";
import {
  buildAssistantSessionKey,
  buildDeterministicConversationReply,
  isConversationMemoryIntent,
  readCookieValue,
} from "../assistant-chat";

describe("isConversationMemoryIntent", () => {
  it("flags prompts about the conversation itself", () => {
    expect(isConversationMemoryIntent("What was my previous question?")).toBe(true);
    expect(isConversationMemoryIntent("Repeat the models you showed earlier")).toBe(true);
    expect(isConversationMemoryIntent("Explain that again")).toBe(true);
  });

  it("does not flag normal data requests", () => {
    expect(isConversationMemoryIntent("Show my 10 recent resumes")).toBe(false);
    expect(isConversationMemoryIntent("List all available AI models")).toBe(false);
    expect(isConversationMemoryIntent("How many credits do I have?")).toBe(false);
  });
});

describe("buildDeterministicConversationReply", () => {
  const history = [
    {
      role: "user" as const,
      content: "Show me all available AI models",
    },
    {
      role: "assistant" as const,
      content: "Here are the available AI models: Model A, Model B, Model C.",
    },
    {
      role: "user" as const,
      content: "What was my previous question?",
    },
  ];

  it("answers the previous-question prompt from history", () => {
    expect(
      buildDeterministicConversationReply({
        history,
        latestUserMessage: "What was my previous question?",
      }),
    ).toBe('You previously asked: "Show me all available AI models"');
  });

  it("answers the previous-reply prompt from history", () => {
    expect(
      buildDeterministicConversationReply({
        history: [
          ...history.slice(0, 2),
          {
            role: "user",
            content: "What did you just say?",
          },
        ],
        latestUserMessage: "What did you just say?",
      }),
    ).toBe("I just said:\n\nHere are the available AI models: Model A, Model B, Model C.");
  });
});

describe("assistant chat session helpers", () => {
  it("builds session keys that stay user and scope specific", () => {
    expect(
      buildAssistantSessionKey({
        scope: "ADMIN",
        userId: "user_123",
        sessionId: "session_abc",
      }),
    ).toBe("admin:user_123:session_abc");

    expect(
      buildAssistantSessionKey({
        scope: "PUBLIC",
        userId: null,
        sessionId: "session_abc",
      }),
    ).toBe("public:session_abc");
  });

  it("reads the assistant session cookie safely", () => {
    expect(
      readCookieValue("foo=bar; rezumerai_ai_chat_session=session-123; hello=world", "rezumerai_ai_chat_session"),
    ).toBe("session-123");
    expect(readCookieValue(null, "rezumerai_ai_chat_session")).toBeNull();
  });
});
