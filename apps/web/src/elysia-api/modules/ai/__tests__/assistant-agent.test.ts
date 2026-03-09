import { describe, expect, it } from "bun:test";
import {
  ASSISTANT_ACCESS_DENIED_REPLY,
  ASSISTANT_GREETING_REPLY,
  ASSISTANT_SAFE_RETRIEVAL_REPLY,
  renderToolEnvelopeReply,
  resolveAssistantExecutionStrategy,
  runMastraAssistantChat,
} from "../assistant-agent";

const baseOptions = {
  db: {} as never,
  getAiConfiguration: async () => ({
    PROMPT_VERSION: "copilot-v1",
    DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
    ASSISTANT_MAX_STEPS: 4,
    ASSISTANT_HISTORY_LIMIT: 8,
    ASSISTANT_SYSTEM_PROMPT: "Assistant prompt",
    COPILOT_SYSTEM_PROMPT: "Copilot prompt",
    OPTIMIZE_SYSTEM_PROMPT: "Optimize prompt",
  }),
  getCurrentModelSettings: async () => ({
    selectedModelId: "openai/gpt-5-nano",
    models: ["openai/gpt-5-nano"],
  }),
  getOptimizationCredits: async () => ({
    dailyLimit: 100,
    remainingCredits: 76,
  }),
  maxSteps: 3,
  modelId: "openai/gpt-5-nano",
  systemPrompt: "You are Rezumerai Assistant.",
};

describe("resolveAssistantExecutionStrategy", () => {
  it("uses a direct greeting for simple hellos", () => {
    expect(
      resolveAssistantExecutionStrategy({
        message: "Hello",
        scope: "PUBLIC",
        userId: null,
      }),
    ).toEqual({
      mode: "direct-reply",
      reply: ASSISTANT_GREETING_REPLY,
      requestedLimit: null,
    });
  });

  it("routes recent error requests to the error log tool", () => {
    expect(
      resolveAssistantExecutionStrategy({
        message: "Show the 5 most recent errors",
        scope: "ADMIN",
        userId: "admin_123",
      }),
    ).toEqual({
      mode: "forced-tool",
      requestedLimit: 5,
      toolName: "listRecentErrorLogs",
    });
  });

  it("blocks admin-only data for non-admin scopes", () => {
    expect(
      resolveAssistantExecutionStrategy({
        message: "Show all registered users",
        scope: "USER",
        userId: "user_123",
      }),
    ).toEqual({
      mode: "access-denied",
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit: 100,
    });
  });
});

describe("renderToolEnvelopeReply", () => {
  it("renders stored AI configuration values instead of fabricated provider fields", () => {
    const reply = renderToolEnvelopeReply({
      type: "metric",
      entity: "ai_configuration",
      summary: "AI configuration loaded from the SystemConfiguration table.",
      data: {
        PROMPT_VERSION: "copilot-v1",
        ASSISTANT_MAX_STEPS: 4,
        ASSISTANT_HISTORY_LIMIT: 8,
      },
    });

    expect(reply).toContain("AI configuration loaded from the SystemConfiguration table.");
    expect(reply).toContain("copilot-v1");
    expect(reply).not.toContain("OpenAI API Key");
    expect(reply).not.toContain("Not available");
  });
});

describe("runMastraAssistantChat", () => {
  it("returns the deterministic greeting without calling the model", async () => {
    let modelCalls = 0;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        history: [{ role: "user", content: "Hello" }],
        latestUserMessage: "Hello",
        scope: "PUBLIC",
        userId: null,
      },
      {
        generate: async () => {
          modelCalls += 1;
          return {
            text: "Should not be used",
            toolCalls: [],
            toolResults: [],
          };
        },
      },
    );

    expect(modelCalls).toBe(0);
    expect(result.reply).toBe(ASSISTANT_GREETING_REPLY);
    expect(result.toolNames).toEqual([]);
  });

  it("executes forced tool requests directly without calling the model", async () => {
    let modelCalls = 0;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        history: [{ role: "user", content: "Show AI_CONFIG" }],
        latestUserMessage: "Show AI_CONFIG",
        scope: "ADMIN",
        userId: "admin_123",
      },
      {
        generate: async () => {
          modelCalls += 1;
          return {
            text: "Hallucinated provider config",
            toolCalls: [],
            toolResults: [],
          };
        },
      },
    );

    expect(modelCalls).toBe(0);
    expect(result.toolNames).toEqual(["getAiConfiguration"]);
    expect(result.reply).toContain("copilot-v1");
    expect(result.reply).not.toContain("Hallucinated");
  });

  it("falls back safely when direct tool execution fails", async () => {
    let modelCalls = 0;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        db: {
          errorLog: {
            findMany: async () => {
              throw new Error("database unavailable");
            },
          },
        } as never,
        history: [{ role: "user", content: "Show the last 5 errors" }],
        latestUserMessage: "Show the last 5 errors",
        scope: "ADMIN",
        userId: "admin_123",
      },
      {
        generate: async () => {
          modelCalls += 1;
          return {
            text: "",
            toolCalls: [],
            toolResults: [],
          };
        },
      },
    );

    expect(modelCalls).toBe(0);
    expect(result.reply).toBe(ASSISTANT_SAFE_RETRIEVAL_REPLY);
    expect(result.toolNames).toEqual(["listRecentErrorLogs"]);
  });

  it("does not send tool-choice options for normal conversational generation", async () => {
    let receivedOptions:
      | {
          maxSteps: number;
          modelSettings?: {
            temperature?: number;
          };
          requestContext: unknown;
        }
      | undefined;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        history: [{ role: "user", content: "Tell me a short joke." }],
        latestUserMessage: "Tell me a short joke.",
        scope: "PUBLIC",
        userId: null,
      },
      {
        generate: async (_messages, options) => {
          receivedOptions = options;

          return {
            text: "Rezumerai helps you build and improve resumes.",
            toolCalls: [],
            toolResults: [],
          };
        },
      },
    );

    expect(receivedOptions).toBeDefined();
    expect("activeTools" in (receivedOptions ?? {})).toBe(false);
    expect("toolChoice" in (receivedOptions ?? {})).toBe(false);
    expect(result.reply).toContain("Rezumerai helps");
    expect(result.toolNames).toEqual([]);
  });
});
