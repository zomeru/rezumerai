import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home Page", () => {
  it("renders the welcome text", () => {
    render(<Home />);

    expect(screen.getByText("Welcome to rezumerai")).toBeInTheDocument();
  });

  it("renders the get started button", () => {
    render(<Home />);

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders a div container", () => {
    const { container } = render(<Home />);

    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(container.firstChild).toHaveClass("p-8");
  });
});
