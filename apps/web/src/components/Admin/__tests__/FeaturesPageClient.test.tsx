import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, waitFor } from "@testing-library/react";
import {
  adminRefetchMock,
  resetAdminHooksModuleMock,
  saveFeatureFlagMutateAsyncMock,
  useFeatureFlagsMock,
} from "@/test-utils/admin-hooks-module-mock";

const routerRefreshMock = mock(() => undefined);
const featureFlagEntry = {
  id: "cfeatflagadminanalytics01",
  name: "new_admin_analytics_ui",
  enabled: true,
  description: "Controls the interactive analytics dashboard rollout.",
  rolloutPercentage: 100,
  createdAt: "2026-03-12T11:00:00.000Z",
  updatedAt: "2026-03-12T11:00:00.000Z",
};
const featureFlagResponse = {
  items: [featureFlagEntry],
};

mock.module("sonner", () => ({
  toast: {
    success: mock(() => undefined),
    error: mock(() => undefined),
  },
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefreshMock,
  }),
}));

describe("FeaturesPageClient", () => {
  beforeEach(() => {
    resetAdminHooksModuleMock();
    useFeatureFlagsMock.mockReturnValue({
      data: featureFlagResponse,
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });
    saveFeatureFlagMutateAsyncMock.mockImplementation(async ({ name, input }) => ({
      id: "cfeatflagadminanalytics01",
      name,
      enabled: input.enabled,
      description: input.description ?? null,
      rolloutPercentage: input.rolloutPercentage,
      createdAt: "2026-03-12T11:00:00.000Z",
      updatedAt: "2026-03-13T11:00:00.000Z",
    }));
    routerRefreshMock.mockClear();
  });

  it("constrains rollout percentage inputs to the 0 to 100 range", async () => {
    const { default: FeaturesPageClient } = await import("../FeaturesPageClient");
    const view = render(<FeaturesPageClient />);

    const rolloutInputs = view.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(rolloutInputs.length).toBe(2);

    const createRolloutInput = rolloutInputs[0];
    const editRolloutInput = rolloutInputs[1];

    if (!createRolloutInput || !editRolloutInput) {
      throw new Error("Expected create and edit rollout inputs to be present.");
    }

    expect(createRolloutInput.getAttribute("min")).toBe("0");
    expect(createRolloutInput.getAttribute("max")).toBe("100");
    expect(createRolloutInput.getAttribute("step")).toBe("1");
    expect(editRolloutInput.getAttribute("min")).toBe("0");
    expect(editRolloutInput.getAttribute("max")).toBe("100");
    expect(editRolloutInput.getAttribute("step")).toBe("1");

    fireEvent.change(createRolloutInput, { target: { value: "150" } });
    fireEvent.change(editRolloutInput, { target: { value: "150" } });

    expect(createRolloutInput.value).toBe("100");
    expect(editRolloutInput.value).toBe("100");
  });

  it("refreshes the router after updating a feature flag so gated routes re-render with the latest value", async () => {
    const { default: FeaturesPageClient } = await import("../FeaturesPageClient");
    const view = render(<FeaturesPageClient />);

    const rolloutInputs = view.getAllByRole("spinbutton") as HTMLInputElement[];
    const editRolloutInput = rolloutInputs[1];

    if (!editRolloutInput) {
      throw new Error("Expected the selected flag rollout input to be present.");
    }

    fireEvent.change(editRolloutInput, { target: { value: "90" } });
    fireEvent.click(view.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(saveFeatureFlagMutateAsyncMock).toHaveBeenCalledTimes(1);
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
