import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Badge from "../Badge";

describe("Badge Component", () => {
  it("renders with title text", () => {
    render(<Badge title="Featured" />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("renders SVG icon with correct title attribute", () => {
    render(<Badge title="New Feature" />);
    const svg = screen.getByTitle("Icon representing a New Feature");
    expect(svg).toBeInTheDocument();
  });

  it("applies default styling", () => {
    const { container } = render(<Badge title="Test Badge" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-primary-400/10");
    expect(badge).toHaveClass("text-primary-800");
    expect(badge).toHaveClass("rounded-full");
  });

  it("applies custom style prop to container", () => {
    const { container } = render(<Badge title="Custom" style="bg-blue-100" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-blue-100");
  });

  it("applies custom svgStyle prop to SVG path", () => {
    render(<Badge title="Custom SVG" svgStyle="stroke-red-500" />);
    const path = document.querySelector("path");
    expect(path).toHaveClass("stroke-red-500");
  });

  it("renders with correct structure (div > svg + span)", () => {
    const { container } = render(<Badge title="Structure Test" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.tagName).toBe("DIV");
    expect(badge.querySelector("svg")).toBeInTheDocument();
    expect(badge.querySelector("span")).toBeInTheDocument();
  });

  it("renders with gap between icon and text", () => {
    const { container } = render(<Badge title="Gap Test" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("gap-2");
  });

  it("renders with correct flex alignment", () => {
    const { container } = render(<Badge title="Flex Test" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("items-center");
    expect(badge).toHaveClass("flex");
  });

  it("handles empty title gracefully", () => {
    const { container } = render(<Badge title="" />);
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe("");
  });

  it("handles long title text", () => {
    const longTitle = "This is a very long badge title that might wrap";
    render(<Badge title={longTitle} />);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("maintains w-fit width class", () => {
    const { container } = render(<Badge title="Width Test" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("w-fit");
  });

  it("applies mb-4 margin bottom", () => {
    const { container } = render(<Badge title="Margin Test" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("mb-4");
  });

  it("renders SVG with correct viewBox", () => {
    const { container } = render(<Badge title="SVG Test" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 13 14");
  });

  it("renders SVG with correct dimensions", () => {
    const { container } = render(<Badge title="SVG Size" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "13");
    expect(svg).toHaveAttribute("height", "14");
  });

  it("applies default stroke color to path", () => {
    render(<Badge title="Default Stroke" />);
    const path = document.querySelector("path");
    expect(path).toHaveClass("stroke-primary-700");
  });

  it("overrides default stroke color with svgStyle", () => {
    render(<Badge title="Override" svgStyle="stroke-green-600" />);
    const path = document.querySelector("path");
    expect(path).toHaveClass("stroke-green-600");
    // svgStyle overrides default, so both classes are present due to cn() merging
  });

  it("combines custom style with default classes", () => {
    const { container } = render(<Badge title="Combined" style="bg-purple-200 border-purple-400" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass("bg-purple-200");
    expect(badge).toHaveClass("border-purple-400");
    expect(badge).toHaveClass("rounded-full");
  });
});
