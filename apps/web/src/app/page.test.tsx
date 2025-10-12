import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home Page", () => {
  it("renders the home page text", () => {
    render(<Home />);

    expect(screen.getByText("HOME PAGE")).toBeInTheDocument();
  });

  it("renders a div element", () => {
    const { container } = render(<Home />);

    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(container.firstChild).toHaveTextContent("HOME PAGE");
  });
});
