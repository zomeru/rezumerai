import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";

const isFeatureEnabledMock = mock(async () => false);
const getServerSessionIdentityMock = mock(async () => ({
  userId: "admin_123",
  role: "ADMIN",
}));
const getAnalyticsDashboardMock = mock(async () => ({
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
}));
const setQueryDataMock = mock(() => undefined);
const dehydrateMock = mock(() => ({ dehydrated: true }));

mock.module("@rezumerai/database", () => ({
  Prisma: {},
  prisma: {},
}));

mock.module("@/lib/feature-flags", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

mock.module("@/lib/server-runtime", () => ({
  getServerSessionIdentity: getServerSessionIdentityMock,
}));

mock.module("@/elysia-api/modules/admin/service", () => ({
  AdminService: {
    getAnalyticsDashboard: getAnalyticsDashboardMock,
  },
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

mock.module("@/components/Admin/AnalyticsDashboardPageClient", () => ({
  default: () => <div>Legacy analytics UI</div>,
}));

mock.module("@/components/Admin/AnalyticsDashboardInteractivePageClient", () => ({
  default: () => <div>Interactive analytics UI</div>,
}));

const { default: AdminAnalyticsPage } = await import("../page");

describe("/admin/analytics", () => {
  beforeEach(() => {
    isFeatureEnabledMock.mockReset();
    isFeatureEnabledMock.mockResolvedValue(false);
    getServerSessionIdentityMock.mockClear();
    getAnalyticsDashboardMock.mockClear();
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
