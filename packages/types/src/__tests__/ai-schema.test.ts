import { describe, expect, it } from "bun:test";
import {
  AiConfigurationSchema,
  AssistantHistoryResponseSchema,
  DEFAULT_AI_CONFIGURATION,
  normalizeAiConfiguration,
} from "../ai/schema";

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
  it("uses a plain-text text optimizer prompt instead of requesting JSON output", () => {
    expect(DEFAULT_AI_CONFIGURATION.TEXT_OPTIMIZER_SYSTEM_PROMPT.toLowerCase()).not.toContain("json");
    expect(DEFAULT_AI_CONFIGURATION.TEXT_OPTIMIZER_SYSTEM_PROMPT.toLowerCase()).toContain("plain text");
  });

  it("defines distinct feature-specific prompts for each resume copilot action", () => {
    expect(DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT).not.toBe(
      DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_TAILOR_SYSTEM_PROMPT,
    );
    expect(DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT).not.toBe(
      DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT,
    );
    expect(DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_TAILOR_SYSTEM_PROMPT).not.toBe(
      DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT,
    );
  });
});

describe("normalizeAiConfiguration", () => {
  it("maps legacy prompt keys into the new feature-specific prompt fields", () => {
    const normalized = normalizeAiConfiguration({
      ...DEFAULT_AI_CONFIGURATION,
      TEXT_OPTIMIZER_SYSTEM_PROMPT: undefined,
      RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT: undefined,
      RESUME_COPILOT_TAILOR_SYSTEM_PROMPT: undefined,
      RESUME_COPILOT_REVIEW_SYSTEM_PROMPT: undefined,
      OPTIMIZE_SYSTEM_PROMPT: "Legacy text optimizer prompt. Return plain text only.",
      COPILOT_SYSTEM_PROMPT: "Legacy copilot prompt. Return compact JSON only.",
    });

    expect(normalized.TEXT_OPTIMIZER_SYSTEM_PROMPT).toBe("Legacy text optimizer prompt. Return plain text only.");
    expect(normalized.RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT).toBe("Legacy copilot prompt. Return compact JSON only.");
    expect(normalized.RESUME_COPILOT_TAILOR_SYSTEM_PROMPT).toBe("Legacy copilot prompt. Return compact JSON only.");
    expect(normalized.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT).toBe("Legacy copilot prompt. Return compact JSON only.");
  });

  it("fills missing prompt fields from defaults without changing unrelated values", () => {
    const normalized = normalizeAiConfiguration({
      PROMPT_VERSION: "custom-v9",
      DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 42,
    });

    expect(normalized.PROMPT_VERSION).toBe("custom-v9");
    expect(normalized.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT).toBe(42);
    expect(normalized.TEXT_OPTIMIZER_SYSTEM_PROMPT).toBe(DEFAULT_AI_CONFIGURATION.TEXT_OPTIMIZER_SYSTEM_PROMPT);
    expect(normalized.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT).toBe(
      DEFAULT_AI_CONFIGURATION.RESUME_COPILOT_REVIEW_SYSTEM_PROMPT,
    );
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
