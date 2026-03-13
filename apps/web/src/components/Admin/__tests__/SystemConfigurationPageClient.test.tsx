import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import {
  adminRefetchMock,
  resetAdminHooksModuleMock,
  updateSystemConfigurationMutateAsyncMock,
  useSystemConfigurationsMock,
} from "@/test-utils/admin-hooks-module-mock";

mock.module("sonner", () => ({
  toast: {
    success: mock(() => undefined),
    error: mock(() => undefined),
  },
}));

describe("SystemConfigurationPageClient", () => {
  beforeEach(() => {
    resetAdminHooksModuleMock();
    useSystemConfigurationsMock.mockReturnValue({
      data: {
        items: [
          {
            id: "cfg_1",
            name: "AI_CONFIG",
            description: "AI settings",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
            createdAt: "2026-03-11T08:21:00.000Z",
            updatedAt: "2026-03-11T08:21:00.000Z",
            value: {
              providers: {
                primary: "openrouter",
              },
            },
          },
        ],
      },
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });
    updateSystemConfigurationMutateAsyncMock.mockImplementation(async () => undefined as never);
  });

  it("shows the raw JSON editor by default and lets users switch to structured preview", async () => {
    const { default: SystemConfigurationPageClient } = await import("../SystemConfigurationPageClient");
    const view = render(<SystemConfigurationPageClient />);

    expect(view.getByRole("tab", { name: "Raw JSON" })).toHaveAttribute("aria-selected", "true");
    expect(view.getByRole("textbox")).toBeTruthy();
    expect(view.queryByLabelText("Structured JSON viewer")).toBeNull();

    fireEvent.click(view.getByRole("tab", { name: "Structured Preview" }));

    await waitFor(() => {
      expect(view.getByRole("tab", { name: "Structured Preview" })).toHaveAttribute("aria-selected", "true");
    });

    expect(view.queryByRole("textbox")).toBeNull();
    expect(view.getByLabelText("Structured JSON viewer")).toBeTruthy();

    view.unmount();
    await act(async () => {});
  });
});
