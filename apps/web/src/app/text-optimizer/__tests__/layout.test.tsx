import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";

mock.module("@/components", () => ({
  Navbar: () => <div data-testid="authenticated-navbar">Authenticated Navbar</div>,
}));

describe("/text-optimizer layout", () => {
  afterEach(() => {
    cleanup();
  });

  it("wraps content with the shared authenticated navbar", async () => {
    const layoutModule = await import("../layout").catch(() => null);

    expect(layoutModule).not.toBeNull();

    if (!layoutModule) {
      return;
    }

    const TextOptimizerLayout = layoutModule.default as ({ children }: { children: ReactNode }) => React.JSX.Element;
    const view = render(
      <TextOptimizerLayout>
        <div>Optimizer page content</div>
      </TextOptimizerLayout>,
    );

    expect(view.getByTestId("authenticated-navbar")).toBeTruthy();
    expect(view.getByText("Optimizer page content")).toBeTruthy();
  });
});
