import { describe, expect, it, mock } from "bun:test";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";

const createAuditLogMock = mock(async () => undefined);
const clearFeatureFlagCacheMock = mock(() => undefined);
type MockFunction = ReturnType<typeof mock>;

interface MockDb {
  systemConfiguration: {
    findUnique: MockFunction;
    upsert: MockFunction;
  };
  featureFlag: {
    findMany: MockFunction;
    findUnique: MockFunction;
    upsert: MockFunction;
  };
}

mock.module("@rezumerai/database", () => ({
  Prisma: {
    JsonNull: null,
  },
  prisma: {},
}));

mock.module("@/lib/auth", () => ({
  setManagedUserPassword: mock(async () => undefined),
}));

mock.module("../../../observability/audit", () => ({
  createAuditLog: createAuditLogMock,
  toAuditSearchWhere: mock(() => ({})),
}));

mock.module("@/lib/feature-flags", () => ({
  clearFeatureFlagCache: clearFeatureFlagCacheMock,
}));

const aiServiceMock = {
  AiCreditsExhaustedError: class AiCreditsExhaustedError extends Error {},
  AiModelPolicyRestrictedError: class AiModelPolicyRestrictedError extends Error {},
  AiModelUnavailableError: class AiModelUnavailableError extends Error {},
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
    featureFlag: {
      findMany: mock(),
      findUnique: mock(),
      upsert: mock(),
    },
  } satisfies MockDb;
}

describe("AdminService.updateSystemConfiguration", () => {
  it("persists non-secret token limit configuration values without redacting them", async () => {
    const db = makeMockDb();
    const nextValue = {
      ...DEFAULT_AI_CONFIGURATION,
      ASSISTANT_CONTEXT_TOKEN_LIMIT: 4096,
    };

    db.systemConfiguration.findUnique.mockResolvedValue({
      id: "cfg_123",
      name: "AI_CONFIG",
      description: null,
      value: DEFAULT_AI_CONFIGURATION,
    });
    db.systemConfiguration.upsert.mockResolvedValue({
      id: "cfg_123",
      name: "AI_CONFIG",
      description: "AI config",
      value: nextValue,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    });

    const result = await AdminService.updateSystemConfiguration(db as never, "admin_123", "AI_CONFIG", nextValue);

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

describe("AdminService.listFeatureFlags", () => {
  it("maps persisted feature flags into the admin response shape", async () => {
    const db = makeMockDb();

    db.featureFlag.findMany.mockResolvedValue([
      {
        id: "cfeatflagadminanalytics01",
        name: "new_admin_analytics_ui",
        enabled: false,
        description: "Interactive analytics dashboard rollout",
        rolloutPercentage: 100,
        createdAt: new Date("2026-03-12T00:00:00.000Z"),
        updatedAt: new Date("2026-03-12T00:00:00.000Z"),
      },
    ]);

    const result = await AdminService.listFeatureFlags(db as never);

    expect(result).toEqual({
      items: [
        {
          id: "cfeatflagadminanalytics01",
          name: "new_admin_analytics_ui",
          enabled: false,
          description: "Interactive analytics dashboard rollout",
          rolloutPercentage: 100,
          createdAt: "2026-03-12T00:00:00.000Z",
          updatedAt: "2026-03-12T00:00:00.000Z",
        },
      ],
    });
  });

  it("returns an empty list when the feature_flag table is not available yet", async () => {
    const db = makeMockDb();

    db.featureFlag.findMany.mockRejectedValue({
      code: "P2021",
    });

    await expect(AdminService.listFeatureFlags(db as never)).resolves.toEqual({
      items: [],
    });
  });
});

describe("AdminService.saveFeatureFlag", () => {
  it("creates feature flags, clears cache, and writes an audit log", async () => {
    const db = makeMockDb();

    db.featureFlag.findUnique.mockResolvedValue(null);
    db.featureFlag.upsert.mockResolvedValue({
      id: "cfeatflagadminanalytics01",
      name: "new_admin_analytics_ui",
      enabled: true,
      description: "Interactive analytics dashboard rollout",
      rolloutPercentage: 100,
      createdAt: new Date("2026-03-12T00:00:00.000Z"),
      updatedAt: new Date("2026-03-12T00:00:00.000Z"),
    });

    const result = await AdminService.saveFeatureFlag(db as never, "admin_123", "new_admin_analytics_ui", {
      enabled: true,
      description: "Interactive analytics dashboard rollout",
      rolloutPercentage: 100,
    });

    expect(db.featureFlag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: "new_admin_analytics_ui" },
        create: expect.objectContaining({
          name: "new_admin_analytics_ui",
          enabled: true,
          description: "Interactive analytics dashboard rollout",
          rolloutPercentage: 100,
        }),
        update: expect.objectContaining({
          enabled: true,
          description: "Interactive analytics dashboard rollout",
          rolloutPercentage: 100,
        }),
      }),
    );
    expect(clearFeatureFlagCacheMock).toHaveBeenCalledWith("new_admin_analytics_ui");
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "FEATURE_FLAG_CREATED",
        action: "CREATE",
        resourceType: "FeatureFlag",
        userId: "admin_123",
      }),
    );
    expect(result).toEqual({
      id: "cfeatflagadminanalytics01",
      name: "new_admin_analytics_ui",
      enabled: true,
      description: "Interactive analytics dashboard rollout",
      rolloutPercentage: 100,
      createdAt: "2026-03-12T00:00:00.000Z",
      updatedAt: "2026-03-12T00:00:00.000Z",
    });
  });

  it("records previous values when an existing feature flag is updated", async () => {
    const db = makeMockDb();

    db.featureFlag.findUnique.mockResolvedValue({
      id: "cfeatflagadminanalytics01",
      name: "new_admin_analytics_ui",
      enabled: false,
      description: "Legacy analytics rollout",
      rolloutPercentage: 0,
    });
    db.featureFlag.upsert.mockResolvedValue({
      id: "cfeatflagadminanalytics01",
      name: "new_admin_analytics_ui",
      enabled: true,
      description: "Interactive analytics dashboard rollout",
      rolloutPercentage: 50,
      createdAt: new Date("2026-03-12T00:00:00.000Z"),
      updatedAt: new Date("2026-03-12T01:00:00.000Z"),
    });

    await AdminService.saveFeatureFlag(db as never, "admin_123", "new_admin_analytics_ui", {
      enabled: true,
      description: "Interactive analytics dashboard rollout",
      rolloutPercentage: 50,
    });

    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "FEATURE_FLAG_UPDATED",
        action: "UPDATE",
        beforeValues: {
          name: "new_admin_analytics_ui",
          enabled: false,
          description: "Legacy analytics rollout",
          rolloutPercentage: 0,
        },
        afterValues: {
          name: "new_admin_analytics_ui",
          enabled: true,
          description: "Interactive analytics dashboard rollout",
          rolloutPercentage: 50,
        },
      }),
    );
  });
});
