import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { AdminPageShell } from "../AdminUI";

describe("AdminPageShell", () => {
  it("renders shared admin header actions alongside page-specific controls", () => {
    const onRefresh = mock(() => undefined);
    const Shell = AdminPageShell as unknown as (props: {
      title: string;
      description: string;
      backHref: string;
      onRefresh: () => void;
      isRefreshing: boolean;
      action: ReactNode;
      children: ReactNode;
    }) => JSX.Element;

    const view = render(
      <Shell
        title="AI Models"
        description="Read-only view of the AI models dynamically fetched from OpenRouter."
        backHref="/admin"
        onRefresh={onRefresh}
        isRefreshing={false}
        action={<div>Extra control</div>}
      >
        <div>Body</div>
      </Shell>,
    );

    expect(view.getByRole("link", { name: "Back to admin" })).toHaveAttribute("href", "/admin");
    expect(view.getByText("Extra control")).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
