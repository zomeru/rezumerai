import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render, within } from "@testing-library/react";
import {
  adminRefetchMock,
  resetAdminHooksModuleMock,
  useAdminAnalyticsMock,
} from "@/test-utils/admin-hooks-module-mock";

mock.module("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-responsive">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Line: () => null,
  Bar: () => null,
}));

describe("AnalyticsDashboardInteractivePageClient", () => {
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

  it("renders labeled interactive chart regions for the flagged analytics experience", async () => {
    const { default: AnalyticsDashboardInteractivePageClient } = await import(
      "../AnalyticsDashboardInteractivePageClient"
    );
    const view = render(<AnalyticsDashboardInteractivePageClient />);

    expect(view.getByLabelText("Interactive request volume chart")).toBeTruthy();
    expect(view.getByLabelText("Interactive endpoint usage chart")).toBeTruthy();
    expect(view.getByLabelText("Interactive latency and active users chart")).toBeTruthy();
  });

  it("keeps paired analytics cards aligned while letting charts fill the available panel height", async () => {
    const { default: AnalyticsDashboardInteractivePageClient } = await import(
      "../AnalyticsDashboardInteractivePageClient"
    );
    const view = render(<AnalyticsDashboardInteractivePageClient />);

    const analyticsRows = Array.from(view.container.querySelectorAll("div")).filter((element) =>
      element.className.includes("xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"),
    );

    expect(analyticsRows.length).toBeGreaterThan(0);
    for (const row of analyticsRows) {
      expect(row.className).not.toContain("xl:items-start");
    }

    expect(view.getByLabelText("Interactive request volume chart").getAttribute("class")).toContain("flex-1");
    expect(view.getByLabelText("Interactive endpoint usage chart").getAttribute("class")).toContain("flex-1");
  });

  it("renders endpoint names above each interactive usage bar instead of reserving a left axis gutter", async () => {
    const { default: AnalyticsDashboardInteractivePageClient } = await import(
      "../AnalyticsDashboardInteractivePageClient"
    );
    const view = render(<AnalyticsDashboardInteractivePageClient />);
    const endpointUsagePanel = view.getByRole("heading", { name: "Endpoint Usage" }).closest("section");

    expect(endpointUsagePanel).toBeTruthy();
    const scopedView = within(endpointUsagePanel as HTMLElement);

    expect(scopedView.getByText("GET /api/admin/analytics")).toBeTruthy();
    expect(scopedView.getByText("1,600 req · 0.01% err")).toBeTruthy();
    expect(scopedView.getByText("GET /api/admin/users")).toBeTruthy();
    expect(scopedView.getByText("900 req · 0.02% err")).toBeTruthy();
  });

  it("promotes hovered endpoint rows above neighboring bars so tooltips are not covered", async () => {
    const { default: AnalyticsDashboardInteractivePageClient } = await import(
      "../AnalyticsDashboardInteractivePageClient"
    );
    const view = render(<AnalyticsDashboardInteractivePageClient />);
    const endpointUsagePanel = view.getByRole("heading", { name: "Endpoint Usage" }).closest("section");

    expect(endpointUsagePanel).toBeTruthy();
    const firstRowChart = within(endpointUsagePanel as HTMLElement).getByLabelText(
      "GET /api/admin/analytics endpoint usage bar",
    );
    const firstRow = firstRowChart.parentElement;

    expect(firstRow).toBeTruthy();
    expect(firstRow?.getAttribute("class")).toContain("relative");
    expect(firstRow?.getAttribute("class")).toContain("hover:z-20");
    expect(firstRow?.getAttribute("class")).toContain("focus-within:z-20");
  });
});
