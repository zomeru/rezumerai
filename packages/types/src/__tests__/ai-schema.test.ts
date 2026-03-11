import { describe, expect, it } from "bun:test";
import { AiConfigurationSchema, AssistantHistoryResponseSchema, DEFAULT_AI_CONFIGURATION } from "../ai/schema";

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

describe("DEFAULT_AI_CONFIGURATION model fields", () => {
  it("includes ASSISTANT_MODEL_ID defaulting to openrouter/free", () => {
    expect(DEFAULT_AI_CONFIGURATION.ASSISTANT_MODEL_ID).toBe("openrouter/free");
  });

  it("includes DEFAULT_MODEL_ID defaulting to openrouter/free", () => {
    expect(DEFAULT_AI_CONFIGURATION.DEFAULT_MODEL_ID).toBe("openrouter/free");
  });

  it("validates both fields via AiConfigurationSchema", () => {
    const result = AiConfigurationSchema.safeParse(DEFAULT_AI_CONFIGURATION);
    expect(result.success).toBe(true);
  });
});
