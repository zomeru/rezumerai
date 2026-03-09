import { describe, expect, it } from "bun:test";
import {
  ASSISTANT_ACCESS_DENIED_REPLY,
  ASSISTANT_GREETING_REPLY,
  ASSISTANT_SAFE_RETRIEVAL_REPLY,
  classifyAssistantIntent,
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

describe("classifyAssistantIntent", () => {
  it("classifies greetings as general prompts", () => {
    expect(classifyAssistantIntent("Hello")).toEqual({
      category: "general",
      requiresAuth: false,
      requiredRole: null,
      allowedToolScope: "none",
      confidence: 0.99,
      reason: "Simple greeting or casual conversation.",
    });
  });

  it("classifies privacy policy requests as public", () => {
    expect(classifyAssistantIntent("What's the website privacy policy?")).toEqual({
      category: "public",
      requiresAuth: false,
      requiredRole: null,
      allowedToolScope: "public",
      confidence: 0.98,
      reason: "Asked for public RezumerAI site content or public product information.",
    });
  });

  it("classifies user data requests as user_private", () => {
    expect(classifyAssistantIntent("Show my resumes")).toEqual({
      category: "user_private",
      requiresAuth: true,
      requiredRole: "USER",
      allowedToolScope: "user",
      confidence: 0.98,
      reason: "Asked for the current user's private account or resume data.",
    });
  });

  it("classifies admin data requests as admin_private", () => {
    expect(classifyAssistantIntent("Show the 5 most recent errors")).toEqual({
      category: "admin_private",
      requiresAuth: true,
      requiredRole: "ADMIN",
      allowedToolScope: "admin",
      confidence: 0.99,
      reason: "Asked for admin-only operational, configuration, analytics, or system data.",
    });
  });

  it("classifies broader registered-users phrasing as admin_private", () => {
    expect(classifyAssistantIntent("Show all the users registered on this website.")).toEqual({
      category: "admin_private",
      requiresAuth: true,
      requiredRole: "ADMIN",
      allowedToolScope: "admin",
      confidence: 0.99,
      reason: "Asked for admin-only operational, configuration, analytics, or system data.",
    });
  });
});

describe("resolveAssistantExecutionStrategy", () => {
  it("uses a direct greeting for simple hellos", () => {
    const result = resolveAssistantExecutionStrategy({
      message: "Hello",
      scope: "PUBLIC",
      userId: null,
    });

    expect(result.mode).toBe("direct-reply");
    expect(result.reply).toBe(ASSISTANT_GREETING_REPLY);
    expect(result.classification.category).toBe("general");
  });

  it("routes recent error requests to the error log tool", () => {
    const result = resolveAssistantExecutionStrategy({
      message: "Show the 5 most recent errors",
      scope: "ADMIN",
      userId: "admin_123",
    });

    expect(result.mode).toBe("forced-tool");
    expect(result.requestedLimit).toBe(5);
    expect(result.classification.category).toBe("admin_private");
    expect(result.toolName).toBe("listRecentErrorLogs");
  });

  it("routes broader registered-users phrasing to the registered users tool", () => {
    const result = resolveAssistantExecutionStrategy({
      message: "Show all the users registered on this website.",
      scope: "ADMIN",
      userId: "admin_123",
    });

    expect(result.mode).toBe("forced-tool");
    expect(result.classification.category).toBe("admin_private");
    expect(result.requestedLimit).toBe(100);
    expect(result.toolName).toBe("listRegisteredUsers");
  });

  it("routes public privacy policy requests to the public content tool", () => {
    const result = resolveAssistantExecutionStrategy({
      message: "What's the website privacy policy?",
      scope: "PUBLIC",
      userId: null,
    });

    expect(result.mode).toBe("forced-tool");
    expect(result.classification.category).toBe("public");
    expect(result.toolName).toBe("getPublicPrivacyPolicy");
  });

  it("blocks admin-only data for non-admin scopes", () => {
    const result = resolveAssistantExecutionStrategy({
      message: "Show all registered users",
      scope: "USER",
      userId: "user_123",
    });

    expect(result.mode).toBe("access-denied");
    expect(result.reply).toBe(ASSISTANT_ACCESS_DENIED_REPLY);
    expect(result.classification.category).toBe("admin_private");
    expect(result.requestedLimit).toBe(100);
  });
});

describe("renderToolEnvelopeReply", () => {
  it("formats public app overview content into readable sections", () => {
    const reply = renderToolEnvelopeReply({
      type: "detail",
      entity: "public_app_overview",
      summary: "Grounded public overview of Rezumerai.",
      item: {
        title: "Build a resume you are proud to send with reviewable AI help.",
        summary:
          "RezumerAI helps you create professional resumes with AI-assisted improvements while keeping you fully in control of every change.",
        features: [
          {
            title: "Resume Copilot",
            description:
              "Get AI suggestions to improve resume sections while reviewing every change before applying it.",
          },
          {
            title: "Targeted Resume Tailoring",
            description: "Adapt your resume to match specific job descriptions and highlight the most relevant skills.",
          },
        ],
        trustBadges: ["Structured resume builder", "Reviewable AI suggestions"],
        workflow: [],
        cta: { label: "Get started", href: "/signup" },
      },
    });

    expect(reply).toContain("Here are some of its key features:");
    expect(reply).toContain("**Resume Copilot**");
    expect(reply).toContain("Additional benefits include:");
    expect(reply).not.toContain("title:");
    expect(reply).not.toContain("trustBadges");
  });

  it("formats FAQ data without exposing internal keys", () => {
    const reply = renderToolEnvelopeReply({
      type: "detail",
      entity: "faq",
      summary: "Public FAQ content.",
      item: {
        title: "Frequently Asked Questions",
        summary: "Answers about resume creation and AI assistance.",
        categories: [
          {
            id: "product",
            title: "Product basics",
            items: [
              {
                id: "what-is-rezumerai",
                question: "What does Rezumerai do?",
                answer: "Rezumerai helps you build, edit, and tailor resumes with reviewable AI assistance.",
                tags: ["product"],
              },
            ],
          },
        ],
      },
    });

    expect(reply).toContain("**Product basics**");
    expect(reply).toContain("1. **What does Rezumerai do?**");
    expect(reply).not.toContain("categories:");
    expect(reply).not.toContain("question:");
  });

  it("formats resume collections as user-friendly lists", () => {
    const reply = renderToolEnvelopeReply({
      type: "collection",
      entity: "resume",
      summary: "Recent resumes for the current user (up to 5).",
      count: 2,
      items: [
        {
          id: "res_1",
          title: "Product Manager Resume",
          updatedAt: "2026-03-08T10:00:00.000Z",
          visibility: "private",
        },
        {
          id: "res_2",
          title: "Designer Resume",
          updatedAt: "2026-03-06T09:00:00.000Z",
          visibility: "public",
        },
      ],
      meta: null,
    });

    expect(reply).toContain("Here are your most recent resumes.");
    expect(reply).toContain("**Product Manager Resume**");
    expect(reply).toContain("Visibility: private.");
    expect(reply).not.toContain("updatedAt");
    expect(reply).not.toContain("id:");
  });

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

    expect(reply).toContain("Here is the current AI configuration used by the app.");
    expect(reply).toContain("copilot-v1");
    expect(reply).toContain("**Prompt version:**");
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

  it("returns real registered users from the backend tool instead of model text", async () => {
    let modelCalls = 0;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        db: {
          user: {
            findMany: async () => [
              {
                id: "user_1",
                name: "Real Admin",
                email: "admin@rezumerai.test",
                role: "ADMIN",
                createdAt: new Date("2026-03-01T10:00:00.000Z"),
              },
            ],
          },
        } as never,
        history: [{ role: "user", content: "Show all the users registered on this website." }],
        latestUserMessage: "Show all the users registered on this website.",
        scope: "ADMIN",
        userId: "admin_123",
      },
      {
        generate: async () => {
          modelCalls += 1;
          return {
            text: "John Doe <john@example.com>",
            toolCalls: [],
            toolResults: [],
          };
        },
      },
    );

    expect(modelCalls).toBe(0);
    expect(result.toolNames).toEqual(["listRegisteredUsers"]);
    expect(result.reply).toContain("Real Admin");
    expect(result.reply).toContain("admin@rezumerai.test");
    expect(result.reply).not.toContain("John Doe");
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

  it("returns public privacy policy content for guests without calling the model", async () => {
    let modelCalls = 0;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        db: {
          systemConfiguration: {
            findUnique: async () => null,
          },
        } as never,
        history: [{ role: "user", content: "What's the website privacy policy?" }],
        latestUserMessage: "What's the website privacy policy?",
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
    expect(result.toolNames).toEqual(["getPublicPrivacyPolicy"]);
    expect(result.reply).toContain("Privacy Policy");
    expect(result.reply).toContain("Information we collect");
  });

  it("returns public terms content for guests without calling the model", async () => {
    let modelCalls = 0;

    const result = await runMastraAssistantChat(
      {
        ...baseOptions,
        db: {
          systemConfiguration: {
            findUnique: async () => null,
          },
        } as never,
        history: [{ role: "user", content: "What's the website TOS?" }],
        latestUserMessage: "What's the website TOS?",
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
    expect(result.toolNames).toEqual(["getPublicTermsOfService"]);
    expect(result.reply).toContain("Terms of Service");
    expect(result.reply).toContain("Service overview");
  });
});
