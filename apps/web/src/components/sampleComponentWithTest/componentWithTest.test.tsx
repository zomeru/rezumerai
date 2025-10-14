import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/utils";
import Home from "./componentWithTest";

describe("Home Page", () => {
  it("renders the welcome text", () => {
    renderWithProviders(<Home />);

    expect(screen.getByText("Welcome to rezumerai")).toBeInTheDocument();
  });

  it("renders the get started button", () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders a div container", () => {
    const { container } = renderWithProviders(<Home />);

    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(container.firstChild).toHaveClass("p-8");
  });
});
