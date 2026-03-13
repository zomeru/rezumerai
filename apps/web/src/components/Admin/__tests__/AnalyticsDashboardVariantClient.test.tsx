import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import { adminRefetchMock, resetAdminHooksModuleMock, useFeatureFlagsMock } from "@/test-utils/admin-hooks-module-mock";

mock.module("../AnalyticsDashboardPageClient", () => ({
  default: () => <div>Legacy analytics UI</div>,
}));

mock.module("../AnalyticsDashboardInteractivePageClient", () => ({
  default: () => <div>Interactive analytics UI</div>,
}));

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

    expect(view.getByText("Legacy analytics UI")).toBeTruthy();
    expect(view.queryByText("Interactive analytics UI")).toBeNull();
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

    expect(view.getByText("Interactive analytics UI")).toBeTruthy();
    expect(view.queryByText("Legacy analytics UI")).toBeNull();
  });

  it("falls back to the server-selected variant while the feature flags query is unavailable", async () => {
    const { default: AnalyticsDashboardVariantClient } = await import("../AnalyticsDashboardVariantClient");
    const view = render(<AnalyticsDashboardVariantClient initialUseInteractiveAnalyticsUi={true} />);

    expect(view.getByText("Interactive analytics UI")).toBeTruthy();
    expect(view.queryByText("Legacy analytics UI")).toBeNull();
  });
});
