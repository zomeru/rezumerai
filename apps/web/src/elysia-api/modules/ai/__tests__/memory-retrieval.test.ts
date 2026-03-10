import { describe, expect, it } from "bun:test";
import { assembleConversationContext } from "../memory/retrieval";

describe("assembleConversationContext", () => {
  it("dedupes recent and semantic matches by message id and orders them chronologically", () => {
    const context = assembleConversationContext({
      recentMessages: [
        {
          id: "msg_recent_1",
          role: "assistant",
          content: "First answer",
          createdAt: new Date("2026-03-09T09:00:00.000Z"),
        },
        {
          id: "msg_recent_2",
          role: "user",
          content: "Explain that again",
          createdAt: new Date("2026-03-09T09:01:00.000Z"),
        },
      ],
      semanticMatches: [
        {
          id: "msg_semantic_old",
          role: "user",
          content: "Tell me about resume optimization",
          createdAt: new Date("2026-03-09T08:30:00.000Z"),
          score: 0.93,
        },
        {
          id: "msg_recent_1",
          role: "assistant",
          content: "First answer",
          createdAt: new Date("2026-03-09T09:00:00.000Z"),
          score: 0.89,
        },
      ],
      tokenLimit: 200,
    });

    expect(context.messages.map((message) => message.id)).toEqual(["msg_semantic_old", "msg_recent_1", "msg_recent_2"]);
    expect(context.semanticMatchIds).toEqual(["msg_semantic_old"]);
  });

  it("respects the token budget by keeping the newest context that fits", () => {
    const context = assembleConversationContext({
      recentMessages: [
        {
          id: "older",
          role: "user",
          content: "A".repeat(160),
          createdAt: new Date("2026-03-09T09:00:00.000Z"),
        },
        {
          id: "newer",
          role: "assistant",
          content: "Short answer",
          createdAt: new Date("2026-03-09T09:01:00.000Z"),
        },
      ],
      semanticMatches: [
        {
          id: "semantic",
          role: "assistant",
          content: "Another short answer",
          createdAt: new Date("2026-03-09T08:59:00.000Z"),
          score: 0.91,
        },
      ],
      tokenLimit: 40,
    });

    expect(context.messages.map((message) => message.id)).toEqual(["newer"]);
    expect(context.approxTokenCount).toBeLessThanOrEqual(40);
  });
});
