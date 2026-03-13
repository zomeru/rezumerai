import { beforeEach, describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import {
  adminRefetchMock,
  resetAdminHooksModuleMock,
  useAdminAnalyticsMock,
} from "@/test-utils/admin-hooks-module-mock";

describe("AnalyticsDashboardPageClient", () => {
  beforeEach(() => {
    resetAdminHooksModuleMock();
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
          {
            bucketStart: "2026-03-08T00:00:00.000Z",
            label: "Mar 8",
            requestCount: 620,
            errorCount: 12,
            errorRate: 0.019,
            averageResponseTimeMs: 190,
            activeUsers: 172,
            averageDbQueryCount: 4.5,
            averageDbQueryDurationMs: 29,
            slowQueryRequestCount: 3,
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
          {
            endpoint: "/api/admin/users",
            method: "GET",
            requestCount: 900,
            errorCount: 21,
            errorRate: 0.023,
            averageResponseTimeMs: 240,
            averageDbQueryCount: 5.4,
            averageDbQueryDurationMs: 42,
            slowQueryRequestCount: 5,
            slowQueryRequestRate: 0.0055,
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

  it("keeps legacy analytics cards aligned while letting charts expand within the row", async () => {
    const { default: AnalyticsDashboardPageClient } = await import("../AnalyticsDashboardPageClient");
    const view = render(<AnalyticsDashboardPageClient />);

    const analyticsRows = Array.from(view.container.querySelectorAll("div")).filter((element) =>
      element.className.includes("xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"),
    );

    expect(analyticsRows.length).toBeGreaterThan(0);
    for (const row of analyticsRows) {
      expect(row.className).not.toContain("xl:items-start");
    }

    expect(view.getByLabelText("Request Volume Over Time").getAttribute("class")).toContain("flex-1");
  });
});
