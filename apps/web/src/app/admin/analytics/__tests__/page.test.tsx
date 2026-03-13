import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { render } from "@testing-library/react";

const isFeatureEnabledMock = mock(async () => false);
const getServerSessionIdentityMock = mock(async () => ({
  userId: "admin_123",
  role: "ADMIN",
}));
const setQueryDataMock = mock(() => undefined);
const dehydrateMock = mock(() => ({ dehydrated: true }));

mock.module("@rezumerai/database", () => ({
  Prisma: {},
  prisma: {},
}));

mock.module("@/lib/auth", () => ({
  setManagedUserPassword: mock(async () => undefined),
}));

mock.module("@/lib/feature-flags", () => ({
  clearFeatureFlagCache: mock(() => undefined),
  isFeatureEnabled: isFeatureEnabledMock,
}));

mock.module("@/lib/server-runtime", () => ({
  getServerSessionIdentity: getServerSessionIdentityMock,
}));

mock.module("@/elysia-api/modules/ai/service", () => ({
  AiCreditsExhaustedError: class AiCreditsExhaustedError extends Error {},
  AiModelPolicyRestrictedError: class AiModelPolicyRestrictedError extends Error {},
  AiModelUnavailableError: class AiModelUnavailableError extends Error {},
  AiService: {},
}));

mock.module("@/lib/get-query-client", () => ({
  getQueryClient: () => ({
    setQueryData: setQueryDataMock,
  }),
}));

mock.module("@tanstack/react-query", () => ({
  HydrationBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  dehydrate: dehydrateMock,
}));

mock.module("@/components/Admin/AnalyticsDashboardVariantClient", () => ({
  default: ({ initialUseInteractiveAnalyticsUi }: { initialUseInteractiveAnalyticsUi: boolean }) => (
    <div>{initialUseInteractiveAnalyticsUi ? "Interactive analytics UI" : "Legacy analytics UI"}</div>
  ),
}));

const adminServiceModule = await import("@/elysia-api/modules/admin/service");
const getAnalyticsDashboardSpy = spyOn(adminServiceModule.AdminService, "getAnalyticsDashboard");
const { default: AdminAnalyticsPage } = await import("../page");

describe("/admin/analytics", () => {
  beforeEach(() => {
    isFeatureEnabledMock.mockReset();
    isFeatureEnabledMock.mockResolvedValue(false);
    getServerSessionIdentityMock.mockClear();
    getAnalyticsDashboardSpy.mockReset();
    getAnalyticsDashboardSpy.mockResolvedValue({
      timeframeDays: 7,
      granularity: "day",
      summary: {
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        activeUsers: 0,
        averageResponseTimeMs: 0,
        mostUsedEndpoint: null,
      },
      database: {
        averageDbQueryCount: 0,
        averageDbQueryDurationMs: 0,
        slowQueryRequestCount: 0,
        slowQueryRequestRate: 0,
      },
      requestVolume: [],
      endpointUsage: [],
      slowQueryPatterns: [],
      backgroundJobs: [],
    });
    setQueryDataMock.mockClear();
    dehydrateMock.mockClear();
  });

  it("renders the legacy analytics UI when the feature flag is disabled", async () => {
    const view = render(await AdminAnalyticsPage());

    expect(view.getByText("Legacy analytics UI")).toBeTruthy();
    expect(view.queryByText("Interactive analytics UI")).toBeNull();
  });

  it("renders the interactive analytics UI when the feature flag is enabled", async () => {
    isFeatureEnabledMock.mockResolvedValue(true);

    const view = render(await AdminAnalyticsPage());

    expect(view.getByText("Interactive analytics UI")).toBeTruthy();
    expect(view.queryByText("Legacy analytics UI")).toBeNull();
  });
});
