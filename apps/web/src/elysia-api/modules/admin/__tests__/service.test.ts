import { describe, expect, it, mock } from "bun:test";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";

const createAuditLogMock = mock(async () => undefined);

mock.module("@rezumerai/database", () => ({
  Prisma: {
    JsonNull: null,
  },
}));

mock.module("@/lib/auth", () => ({
  setManagedUserPassword: mock(async () => undefined),
}));

mock.module("../../../observability/audit", () => ({
  createAuditLog: createAuditLogMock,
  toAuditSearchWhere: mock(() => ({})),
}));

const aiServiceMock = {
  AiService: {},
};

mock.module("../ai/service", () => aiServiceMock);
mock.module("../../ai/service", () => aiServiceMock);

mock.module("@/env", () => ({
  serverEnv: {
    BETTER_AUTH_GITHUB_CLIENT_ID: "test-github-client-id",
    BETTER_AUTH_GITHUB_CLIENT_SECRET: "test-github-client-secret",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/rezumerai_test",
    OPENROUTER_API_KEY: "test-openrouter-key",
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  clientEnv: {
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NODE_ENV: "test",
  },
}));

const { AdminService } = await import("../service");

function makeMockDb() {
  return {
    systemConfiguration: {
      findUnique: mock(),
      upsert: mock(),
    },
  } as never;
}

describe("AdminService.updateSystemConfiguration", () => {
  it("persists non-secret token limit configuration values without redacting them", async () => {
    const db = makeMockDb();
    const nextValue = {
      ...DEFAULT_AI_CONFIGURATION,
      ASSISTANT_CONTEXT_TOKEN_LIMIT: 4096,
    };

    (db.systemConfiguration.findUnique as ReturnType<typeof mock>).mockResolvedValue({
      id: "cfg_123",
      name: "AI_CONFIG",
      description: null,
      value: DEFAULT_AI_CONFIGURATION,
    });
    (db.systemConfiguration.upsert as ReturnType<typeof mock>).mockResolvedValue({
      id: "cfg_123",
      name: "AI_CONFIG",
      description: "AI config",
      value: nextValue,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    });

    const result = await AdminService.updateSystemConfiguration(db, "admin_123", "AI_CONFIG", nextValue);

    expect(db.systemConfiguration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          value: expect.objectContaining({
            ASSISTANT_CONTEXT_TOKEN_LIMIT: 4096,
          }),
        }),
        create: expect.objectContaining({
          value: expect.objectContaining({
            ASSISTANT_CONTEXT_TOKEN_LIMIT: 4096,
          }),
        }),
      }),
    );
    expect(result.error).toBeNull();
    expect(result.configuration?.value).toEqual(
      expect.objectContaining({
        ASSISTANT_CONTEXT_TOKEN_LIMIT: 4096,
      }),
    );
  });
});
