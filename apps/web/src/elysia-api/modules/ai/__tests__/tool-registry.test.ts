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

const { createAiToolRegistry } = await import("../tools/registry");

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
      findUnique: mock(),
      findMany: mock(),
    },
    auditLog: {
      findMany: mock(),
    },
    analyticsEvent: {
      count: mock(),
      findMany: mock(),
    },
    errorLog: {
      findMany: mock(),
    },
  } as never;
}

describe("createAiToolRegistry", () => {
  it("filters assistant tools by public scope", () => {
    const registry = createAiToolRegistry({
      db: makeMockDb(),
      role: null,
      scope: "PUBLIC",
      userId: null,
      getAiConfiguration: async () => null,
      getCurrentModelSettings: async () => null,
      getOptimizationCredits: async () => null,
    });

    expect(Object.keys(registry.getAssistantTools())).toEqual(["getPublicAppOverview", "getPublicFaq"]);
  });

  it("filters assistant tools by admin scope", () => {
    const registry = createAiToolRegistry({
      db: makeMockDb(),
      role: "ADMIN",
      scope: "ADMIN",
      userId: "admin_123",
      getAiConfiguration: async () => null,
      getCurrentModelSettings: async () => null,
      getOptimizationCredits: async () => null,
    });

    const toolNames = Object.keys(registry.getAssistantTools());

    expect(toolNames).toContain("getAnalyticsSummary");
    expect(toolNames).toContain("listRegisteredUsers");
    expect(toolNames).toContain("getMyOptimizationCredits");
  });

  it("returns the copilot tool set from the same registry", () => {
    const registry = createAiToolRegistry({
      db: makeMockDb(),
      role: "USER",
      scope: "USER",
      userId: "user_123",
      getAiConfiguration: async () => null,
      getCurrentModelSettings: async () => null,
      getOptimizationCredits: async () => ({
        dailyLimit: 10,
        remainingCredits: 7,
      }),
    });

    expect(Object.keys(registry.getCopilotTools())).toEqual([
      "getResumeSection",
      "getResume",
      "analyzeJobDescription",
      "matchResumeToJob",
      "prepareDraftSectionUpdate",
      "getOptimizationCredits",
    ]);
  });
});
