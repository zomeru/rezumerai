import { beforeEach, describe, expect, it, mock } from "bun:test";
import { ERROR_MESSAGES } from "@/constants/errors";

const resolveSessionUserMock = mock(async () => null);
const trackHandledErrorMock = mock(async () => undefined);
const createAuditLogMock = mock(async () => undefined);
const getAiFeatureAccessMessageMock = mock(
  (state: { emailVerified?: boolean | null; isAnonymous?: boolean | null }) => {
    if (state.isAnonymous === true) {
      return ERROR_MESSAGES.AI_AUTH_REQUIRED;
    }

    if (state.emailVerified === false) {
      return ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED;
    }

    return null;
  },
);

mock.module("../../../plugins/auth", () => ({
  resolveSessionUser: resolveSessionUserMock,
}));

mock.module("../../../plugins/error", () => ({
  trackHandledError: trackHandledErrorMock,
}));

mock.module("../../../observability/audit", () => ({
  createAuditLog: createAuditLogMock,
}));

mock.module("@/lib/ai-access", () => ({
  getAiFeatureAccessMessage: getAiFeatureAccessMessageMock,
}));

mock.module("../service", () => ({
  AiCreditsExhaustedError: class AiCreditsExhaustedError extends Error {},
  AiModelPolicyRestrictedError: class AiModelPolicyRestrictedError extends Error {},
  AiModelUnavailableError: class AiModelUnavailableError extends Error {},
  AiService: {
    emptyUsageMetrics: () => ({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0,
    }),
    getAssistantHistory: mock(async () => ({
      scope: "USER",
      messages: [],
      nextCursor: null,
      hasMore: false,
    })),
    getUserAiSettings: mock(async () => ({
      selectedModelId: "openai/gpt-5-nano",
      models: [],
    })),
    listActiveModels: mock(async () => []),
    resolveOptimizationContext: mock(async () => ({
      model: {
        modelId: "openai/gpt-5-nano",
        providerName: "openrouter",
      },
      config: {
        DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
        OPTIMIZE_SYSTEM_PROMPT: "Optimize",
        PROMPT_VERSION: "v1",
      },
    })),
    runAssistantChat: mock(async () => ({
      scope: "USER",
      reply: "Hello",
      blocks: [{ type: "paragraph", content: "Hello" }],
      toolNames: [],
      usedConversationMemory: false,
    })),
    toAssistantScope: (role: string | null | undefined, isAnonymous = false) =>
      isAnonymous ? "PUBLIC" : role === "ADMIN" ? "ADMIN" : role === "USER" ? "USER" : "PUBLIC",
    updateUserSelectedModel: mock(async () => "openai/gpt-5-nano"),
  },
}));

const controllerModule = await import("../controller");

describe("controller public handlers", () => {
  beforeEach(() => {
    resolveSessionUserMock.mockReset();
    trackHandledErrorMock.mockReset();
    createAuditLogMock.mockReset();
    getAiFeatureAccessMessageMock.mockClear();
  });

  it("returns the assistant failure response for invalid assistant chat input", async () => {
    const response = await controllerModule.handleAssistantChatRequest({
      body: {},
      db: {} as never,
      request: new Request("https://rezumerai.test/ai/assistant/chat", { method: "POST" }),
    });

    expect(response.status).toBe(422);
    expect(response.body.reply).toBe(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
    expect(response.body.scope).toBe("PUBLIC");
    expect(response.body.toolNames).toEqual([]);
  });

  it("denies model listing for users without AI feature access", async () => {
    const response = await controllerModule.handleListModelsRequest({
      db: {} as never,
      request: new Request("https://rezumerai.test/ai/models", { method: "GET" }),
      user: {
        id: "user_123",
        emailVerified: false,
        isAnonymous: false,
      },
    });

    expect(response).toEqual({
      status: 403,
      body: ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED,
    });
    expect(trackHandledErrorMock).toHaveBeenCalledTimes(1);
  });

  it("rejects empty optimize-text input after access verification passes", async () => {
    const response = await controllerModule.handleOptimizeTextRequest({
      body: {
        text: "   ",
      },
      db: {} as never,
      request: new Request("https://rezumerai.test/ai/optimize", { method: "POST" }),
      user: {
        id: "user_123",
        emailVerified: true,
        isAnonymous: false,
      },
    });

    expect(response).toEqual({
      status: 422,
      body: ERROR_MESSAGES.AI_EMPTY_INPUT,
    });
  });
});
