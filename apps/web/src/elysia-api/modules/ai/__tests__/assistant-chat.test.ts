import { describe, expect, it } from "bun:test";
import {
  buildAssistantResourceId,
  buildAssistantThreadCursor,
  buildDeterministicConversationReply,
  isConversationMemoryIntent,
  parseAssistantThreadCursor,
  resolveAssistantScope,
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
  it("builds assistant resource ids for authenticated users", () => {
    expect(
      buildAssistantResourceId({
        userId: "user_123",
        role: "USER",
        isAnonymous: false,
      }),
    ).toBe("assistant:user:user_123");
  });

  it("isolates admin and guest resource memory from normal user memory", () => {
    expect(
      buildAssistantResourceId({
        userId: "user_123",
        role: "ADMIN",
        isAnonymous: false,
      }),
    ).toBe("assistant:admin:user_123");
    expect(
      buildAssistantResourceId({
        userId: "guest_123",
        role: null,
        isAnonymous: true,
      }),
    ).toBe("assistant:guest:guest_123");
  });

  it("treats anonymous users as public-scope assistant users", () => {
    expect(resolveAssistantScope("USER", true)).toBe("PUBLIC");
    expect(resolveAssistantScope("ADMIN", true)).toBe("PUBLIC");
  });

  it("round-trips assistant history cursors", () => {
    const cursor = buildAssistantThreadCursor({
      createdAt: "2026-03-09T12:00:00.000Z",
      id: "message_123",
    });

    expect(parseAssistantThreadCursor(cursor)).toEqual({
      createdAt: "2026-03-09T12:00:00.000Z",
      id: "message_123",
    });
    expect(parseAssistantThreadCursor("not-base64")).toBeNull();
  });
});
