import { beforeEach, describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import {
  adminRefetchMock,
  resetAdminHooksModuleMock,
  useAdminAnalyticsMock,
  useFeatureFlagsMock,
} from "@/test-utils/admin-hooks-module-mock";

describe("AnalyticsDashboardVariantClient", () => {
  beforeEach(() => {
    resetAdminHooksModuleMock();
    useFeatureFlagsMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });
    useAdminAnalyticsMock.mockReturnValue({
      data: {
        timeframeDays: 7,
        granularity: "day",
        summary: {
          totalRequests: 4200,
          totalErrors: 84,
          errorRate: 0.02,
          activeUsers: 230,
          averageResponseTimeMs: 182,
          mostUsedEndpoint: "GET /api/admin/analytics",
        },
        database: {
          averageDbQueryCount: 4.2,
          averageDbQueryDurationMs: 28,
          slowQueryRequestCount: 12,
          slowQueryRequestRate: 0.03,
        },
        requestVolume: [
          {
            bucketStart: "2026-03-07T00:00:00.000Z",
            label: "Mar 7",
            requestCount: 500,
            errorCount: 8,
            errorRate: 0.016,
            averageResponseTimeMs: 176,
            activeUsers: 150,
            averageDbQueryCount: 4.1,
            averageDbQueryDurationMs: 25,
            slowQueryRequestCount: 1,
          },
        ],
        endpointUsage: [
          {
            endpoint: "/api/admin/analytics",
            method: "GET",
            requestCount: 1600,
            errorCount: 12,
            errorRate: 0.0075,
            averageResponseTimeMs: 120,
            averageDbQueryCount: 2.1,
            averageDbQueryDurationMs: 16,
            slowQueryRequestCount: 2,
            slowQueryRequestRate: 0.0012,
          },
        ],
        slowQueryPatterns: [],
        backgroundJobs: [],
      },
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });
  });

  it("renders the legacy analytics UI when the live feature-flag query disables a stale initially enabled variant", async () => {
    useFeatureFlagsMock.mockReturnValue({
      data: {
        items: [
          {
            id: "cfeatflagadminanalytics01",
            name: "new_admin_analytics_ui",
            enabled: false,
            description: "Controls the interactive analytics dashboard rollout.",
            rolloutPercentage: 100,
            createdAt: "2026-03-12T11:00:00.000Z",
            updatedAt: "2026-03-13T11:00:00.000Z",
          },
        ],
      },
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });

    const { default: AnalyticsDashboardVariantClient } = await import("../AnalyticsDashboardVariantClient");
    const view = render(<AnalyticsDashboardVariantClient initialUseInteractiveAnalyticsUi={true} />);

    expect(view.getByText("Most-used endpoints during the selected window.")).toBeTruthy();
    expect(
      view.queryByText("Hover across the reporting window to compare request throughput and error spikes."),
    ).toBeNull();
  });

  it("renders the interactive analytics UI when the live feature-flag query enables a stale initially disabled variant", async () => {
    useFeatureFlagsMock.mockReturnValue({
      data: {
        items: [
          {
            id: "cfeatflagadminanalytics01",
            name: "new_admin_analytics_ui",
            enabled: true,
            description: "Controls the interactive analytics dashboard rollout.",
            rolloutPercentage: 100,
            createdAt: "2026-03-12T11:00:00.000Z",
            updatedAt: "2026-03-13T11:00:00.000Z",
          },
        ],
      },
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });

    const { default: AnalyticsDashboardVariantClient } = await import("../AnalyticsDashboardVariantClient");
    const view = render(<AnalyticsDashboardVariantClient initialUseInteractiveAnalyticsUi={false} />);

    expect(
      view.getByText("Hover across the reporting window to compare request throughput and error spikes."),
    ).toBeTruthy();
    expect(view.queryByText("Most-used endpoints during the selected window.")).toBeNull();
  });

  it("falls back to the server-selected variant while the feature flags query is unavailable", async () => {
    const { default: AnalyticsDashboardVariantClient } = await import("../AnalyticsDashboardVariantClient");
    const view = render(<AnalyticsDashboardVariantClient initialUseInteractiveAnalyticsUi={true} />);

    expect(
      view.getByText("Hover across the reporting window to compare request throughput and error spikes."),
    ).toBeTruthy();
    expect(view.queryByText("Most-used endpoints during the selected window.")).toBeNull();
  });
});
