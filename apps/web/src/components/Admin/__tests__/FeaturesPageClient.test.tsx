import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react";

const refetchMock = mock(async () => undefined);
const mutateAsyncMock = mock(async () => undefined);

mock.module("sonner", () => ({
  toast: {
    success: mock(() => undefined),
    error: mock(() => undefined),
  },
}));

mock.module("@/hooks/useAdmin", () => ({
  useFeatureFlags: mock(() => ({
    data: {
      items: [
        {
          id: "flag_1",
          name: "new_admin_analytics_ui",
          enabled: true,
          description: "Controls the interactive analytics dashboard rollout.",
          rolloutPercentage: 100,
          createdAt: "2026-03-12T11:00:00.000Z",
          updatedAt: "2026-03-12T11:00:00.000Z",
        },
      ],
    },
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: refetchMock,
  })),
  useSaveFeatureFlag: mock(() => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  })),
}));

describe("FeaturesPageClient", () => {
  beforeEach(() => {
    refetchMock.mockClear();
    mutateAsyncMock.mockClear();
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
});
