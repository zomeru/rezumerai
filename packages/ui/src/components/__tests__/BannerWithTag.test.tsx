import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BannerWithTag from "../BannerWithTag";

describe("BannerWithTag Component", () => {
  it("renders with tag text", () => {
    render(<BannerWithTag tag="Feature updates available!" />);
    expect(screen.getByText("Feature updates available!")).toBeInTheDocument();
  });

  it('renders "New" badge', () => {
    render(<BannerWithTag tag="Something new" />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default banner styling", () => {
    const { container } = render(<BannerWithTag tag="Test message" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("w-full");
    expect(banner).toHaveClass("py-2.5");
    expect(banner).toHaveClass("text-center");
    expect(banner).toHaveClass("text-green-800");
  });

  it("applies custom bannerStyle prop", () => {
    const { container } = render(<BannerWithTag tag="Custom banner" bannerStyle="bg-blue-100" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("bg-blue-100");
  });

  it("applies default text badge styling", () => {
    render(<BannerWithTag tag="Test" />);
    const badge = screen.getByText("New");
    expect(badge).toHaveClass("bg-green-600");
    expect(badge).toHaveClass("text-white");
    expect(badge).toHaveClass("rounded-lg");
    expect(badge).toHaveClass("px-3");
    expect(badge).toHaveClass("py-1");
  });

  it("applies custom textStyle prop to New badge", () => {
    render(<BannerWithTag tag="Test" textStyle="bg-blue-600" />);
    const badge = screen.getByText("New");
    expect(badge).toHaveClass("bg-blue-600");
  });

  it("renders tag text next to New badge", () => {
    const { container } = render(<BannerWithTag tag="Premium templates now live" />);
    const paragraph = container.querySelector("p");
    expect(paragraph?.textContent).toContain("New");
    expect(paragraph?.textContent).toContain("Premium templates now live");
  });

  it("applies correct spacing between badge and tag text", () => {
    render(<BannerWithTag tag="Test message" />);
    const badge = screen.getByText("New");
    expect(badge).toHaveClass("mr-2");
  });

  it("renders as full-width banner", () => {
    const { container } = render(<BannerWithTag tag="Full width" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("w-full");
  });

  it("applies text-center alignment", () => {
    const { container } = render(<BannerWithTag tag="Centered" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("text-center");
  });

  it("applies correct font styles", () => {
    const { container } = render(<BannerWithTag tag="Font test" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("font-medium");
    expect(banner).toHaveClass("text-sm");
  });

  it("handles empty tag gracefully", () => {
    render(<BannerWithTag tag="" />);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("handles long tag text", () => {
    const longTag = "This is a very long banner message that might wrap on smaller screens";
    render(<BannerWithTag tag={longTag} />);
    expect(screen.getByText(longTag)).toBeInTheDocument();
  });

  it("renders with proper semantic structure (div > p > span)", () => {
    const { container } = render(<BannerWithTag tag="Structure test" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner.tagName).toBe("DIV");
    expect(banner.querySelector("p")).toBeInTheDocument();
    expect(banner.querySelector("span")).toBeInTheDocument();
  });

  it("combines custom bannerStyle with defaults", () => {
    const { container } = render(<BannerWithTag tag="Test" bannerStyle="bg-purple-100 border border-purple-300" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("bg-purple-100");
    expect(banner).toHaveClass("border");
    expect(banner).toHaveClass("border-purple-300");
    expect(banner).toHaveClass("w-full");
  });

  it("combines custom textStyle with defaults", () => {
    render(<BannerWithTag tag="Test" textStyle="bg-red-600 text-yellow-100" />);
    const badge = screen.getByText("New");
    expect(badge).toHaveClass("bg-red-600");
    expect(badge).toHaveClass("text-yellow-100");
    expect(badge).toHaveClass("rounded-lg");
  });

  it("handles special characters in tag", () => {
    render(<BannerWithTag tag="New Features & Updates — Check them out!" />);
    expect(screen.getByText("New Features & Updates — Check them out!")).toBeInTheDocument();
  });

  it("applies gradient background class", () => {
    const { container } = render(<BannerWithTag tag="Gradient test" />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass("bg-linear-to-r");
  });
});
