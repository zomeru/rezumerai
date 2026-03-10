import { describe, expect, it, mock } from "bun:test";

mock.module("@rezumerai/database", () => ({}));
mock.module("@/lib/system-content", () => ({
  getPublicAppContent: mock(async () => ({
    topic: "landing",
    title: "Rezumerai",
    summary: "Build better resumes.",
    sections: [],
  })),
  searchPublicFaq: mock(async () => []),
}));

const toolsModule = await import("../tools");

function makeMockDb() {
  return {
    resume: {
      findFirst: mock(),
      findMany: mock(),
    },
    user: {
      findMany: mock(),
      findUnique: mock(),
    },
    systemConfiguration: {
      findMany: mock(),
    },
    auditLog: {
      findMany: mock(),
    },
    analyticsEvent: {
      count: mock(),
      findMany: mock(),
    },
  } as never;
}

function listToolNames(tools: readonly Array<{ function: { name: string } }>): string[] {
  return tools.map((tool) => tool.function.name);
}

function findTool<TTool extends { function: { name: string } }>(tools: readonly TTool[], name: string): TTool {
  const tool = tools.find((entry) => entry.function.name === name);

  if (!tool) {
    throw new Error(`Missing tool ${name}`);
  }

  return tool;
}

describe("createAssistantTools", () => {
  it("returns only public assistant tools for public scope", () => {
    const tools = toolsModule.createAssistantTools({
      db: makeMockDb(),
      scope: "PUBLIC",
      userId: null,
      role: null,
      getOptimizationCredits: async () => null,
      getCurrentModelSettings: async () => null,
    });

    expect(listToolNames(tools)).toEqual(["getPublicAppContent", "searchPublicFaq"]);
  });

  it("includes user tools for signed-in users", () => {
    const tools = toolsModule.createAssistantTools({
      db: makeMockDb(),
      scope: "USER",
      userId: "user_123",
      role: "USER",
      getOptimizationCredits: async () => null,
      getCurrentModelSettings: async () => null,
    });

    expect(listToolNames(tools)).toContain("getMyOptimizationCredits");
    expect(listToolNames(tools)).toContain("getMyCurrentModelSettings");
    expect(listToolNames(tools)).not.toContain("getRecentUsers");
  });

  it("includes admin tools for admins", () => {
    const tools = toolsModule.createAssistantTools({
      db: makeMockDb(),
      scope: "ADMIN",
      userId: "admin_123",
      role: "ADMIN",
      getOptimizationCredits: async () => null,
      getCurrentModelSettings: async () => null,
    });

    expect(listToolNames(tools)).toContain("getRecentUsers");
    expect(listToolNames(tools)).toContain("getAnalyticsSummary");
  });

  it("returns current model settings as a metric result", async () => {
    const tools = toolsModule.createAssistantTools({
      db: makeMockDb(),
      scope: "USER",
      userId: "user_123",
      role: "USER",
      getOptimizationCredits: async () => null,
      getCurrentModelSettings: async () => ({
        selectedModelId: "openai/gpt-5-nano",
        models: ["openai/gpt-5-nano", "anthropic/claude-sonnet-4.5"],
      }),
    });

    const result = await findTool(tools, "getMyCurrentModelSettings").function.execute({});

    expect(result).toEqual({
      type: "metric",
      entity: "ai_model_settings",
      summary: "Current selected AI model and available model IDs for the user.",
      data: {
        selectedModelId: "openai/gpt-5-nano",
        models: ["openai/gpt-5-nano", "anthropic/claude-sonnet-4.5"],
      },
    });
  });
});

describe("createCopilotTools", () => {
  it("exposes the expected copilot tool names", () => {
    const tools = toolsModule.createCopilotTools({
      db: makeMockDb(),
      userId: "user_123",
      getOptimizationCredits: async () => ({
        remainingCredits: 7,
        dailyLimit: 10,
      }),
    });

    expect(listToolNames(tools)).toEqual([
      "getResumeSection",
      "getResume",
      "analyzeJobDescription",
      "matchResumeToJob",
      "prepareDraftSectionUpdate",
      "getOptimizationCredits",
    ]);
  });

  it("returns optimization credits through the copilot tool", async () => {
    const tools = toolsModule.createCopilotTools({
      db: makeMockDb(),
      userId: "user_123",
      getOptimizationCredits: async () => ({
        remainingCredits: 7,
        dailyLimit: 10,
      }),
    });

    const result = await findTool(tools, "getOptimizationCredits").function.execute({});

    expect(result).toEqual({
      remainingCredits: 7,
      dailyLimit: 10,
    });
  });
});
