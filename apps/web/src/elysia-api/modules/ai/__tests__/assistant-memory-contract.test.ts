import { describe, expect, it } from "bun:test";
import { AssistantChatInputSchema, AssistantHistoryQuerySchema } from "@rezumerai/types";

describe("assistant memory contracts", () => {
  it("requires a thread id for assistant chat requests", () => {
    expect(
      AssistantChatInputSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
        currentPath: "/",
      }).success,
    ).toBe(false);

    expect(
      AssistantChatInputSchema.safeParse({
        threadId: "assistant-thread-123",
        messages: [{ role: "user", content: "Hello" }],
        currentPath: "/",
      }).success,
    ).toBe(true);
  });

  it("requires a thread id for assistant history requests", () => {
    expect(
      AssistantHistoryQuerySchema.safeParse({
        limit: 20,
      }).success,
    ).toBe(false);

    expect(
      AssistantHistoryQuerySchema.safeParse({
        threadId: "assistant-thread-123",
        limit: 20,
      }).success,
    ).toBe(true);
  });
});
