import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/utils";
import SampleComponentWithTest from "./componentWithTest";

describe("SampleComponentWithTest Page", () => {
  it("renders the welcome text", () => {
    renderWithProviders(<SampleComponentWithTest />);

    expect(screen.getByText("Welcome to rezumerai")).toBeInTheDocument();
  });

  it("renders the get started button", () => {
    renderWithProviders(<SampleComponentWithTest />);

    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();
  });

  it("renders a div container", () => {
    const { container } = renderWithProviders(<SampleComponentWithTest />);

    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(container.firstChild).toHaveClass("p-8");
  });
});
