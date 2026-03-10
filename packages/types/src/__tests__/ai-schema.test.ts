import { describe, expect, it } from "bun:test";
import { AssistantHistoryResponseSchema } from "../ai/schema";

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
