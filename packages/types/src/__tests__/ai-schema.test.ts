import { describe, expect, it } from "bun:test";
import { AssistantHistoryResponseSchema, DEFAULT_AI_CONFIGURATION } from "../ai/schema";

describe("AssistantHistoryResponseSchema", () => {
  it("accepts history responses when createdAt has already been parsed into Date objects", () => {
    const parsed = AssistantHistoryResponseSchema.parse({
      scope: "PUBLIC",
      messages: [
        {
          id: "message_1",
          role: "user",
          content: "What can you do?",
          createdAt: new Date("2026-03-10T03:06:24.200Z"),
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    expect(parsed.messages[0]?.createdAt).toBe("2026-03-10T03:06:24.200Z");
  });
});

describe("DEFAULT_AI_CONFIGURATION", () => {
  it("uses a plain-text optimize prompt instead of requesting JSON output", () => {
    expect(DEFAULT_AI_CONFIGURATION.OPTIMIZE_SYSTEM_PROMPT.toLowerCase()).not.toContain("json");
    expect(DEFAULT_AI_CONFIGURATION.OPTIMIZE_SYSTEM_PROMPT.toLowerCase()).toContain("plain text");
  });
});
