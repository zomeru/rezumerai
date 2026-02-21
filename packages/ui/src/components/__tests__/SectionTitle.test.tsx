import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import SectionTitle from "../SectionTitle";

describe("SectionTitle Component", () => {
  it("renders with title and description", () => {
    render(<SectionTitle title="Our Features" description="Discover powerful tools" />);
    expect(screen.getByText("Our Features")).toBeInTheDocument();
    expect(screen.getByText("Discover powerful tools")).toBeInTheDocument();
  });

  it("renders title in h2 heading", () => {
    render(<SectionTitle title="Test Title" description="Test Description" />);
    const heading = screen.getByText("Test Title");
    expect(heading.tagName).toBe("H2");
  });

  it("renders description in paragraph", () => {
    render(<SectionTitle title="Title" description="Description text" />);
    const description = screen.getByText("Description text");
    expect(description.tagName).toBe("P");
  });

  it("applies correct heading styles", () => {
    render(<SectionTitle title="Styled Title" description="Description" />);
    const heading = screen.getByText("Styled Title");
    expect(heading).toHaveClass("font-medium");
    expect(heading).toHaveClass("text-3xl");
    expect(heading).toHaveClass("sm:text-4xl");
  });

  it("applies correct description styles", () => {
    render(<SectionTitle title="Title" description="Styled Description" />);
    const description = screen.getByText("Styled Description");
    expect(description).toHaveClass("mt-4");
    expect(description).toHaveClass("max-w-2xl");
    expect(description).toHaveClass("text-slate-500");
  });

  it("applies centered text alignment to container", () => {
    const { container } = render(<SectionTitle title="Title" description="Description" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("text-center");
  });

  it("applies correct container styles", () => {
    const { container } = render(<SectionTitle title="Title" description="Description" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("mt-6");
    expect(wrapper).toHaveClass("text-slate-700");
  });

  it("handles empty title", () => {
    render(<SectionTitle title="" description="Description only" />);
    expect(screen.getByText("Description only")).toBeInTheDocument();
    const heading = screen.getByRole("heading");
    expect(heading).toHaveTextContent("");
  });

  it("handles empty description", () => {
    const { container } = render(<SectionTitle title="Title only" description="" />);
    expect(screen.getByText("Title only")).toBeInTheDocument();
    const description = container.querySelector("p");
    expect(description).toBeInTheDocument();
    expect(description?.textContent).toBe("");
  });

  it("handles long title text", () => {
    const longTitle = "This is a very long title that might span multiple lines on smaller screens";
    render(<SectionTitle title={longTitle} description="Description" />);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("handles long description text", () => {
    const longDesc =
      "This is a very long description that provides detailed information about the section and might wrap to multiple lines";
    render(<SectionTitle title="Title" description={longDesc} />);
    expect(screen.getByText(longDesc)).toBeInTheDocument();
  });

  it("renders with special characters in title", () => {
    render(<SectionTitle title="Features & Benefits" description="Description" />);
    expect(screen.getByText("Features & Benefits")).toBeInTheDocument();
  });

  it("renders with special characters in description", () => {
    render(<SectionTitle title="Title" description="Tools & Resources — Everything you need!" />);
    expect(screen.getByText("Tools & Resources — Everything you need!")).toBeInTheDocument();
  });

  it("maintains proper semantic HTML structure", () => {
    const { container } = render(<SectionTitle title="Semantic Title" description="Semantic Description" />);
    expect(container.querySelector("div > h2")).toBeInTheDocument();
    expect(container.querySelector("div > p")).toBeInTheDocument();
  });

  it("renders responsive text size classes", () => {
    render(<SectionTitle title="Responsive" description="Description" />);
    const heading = screen.getByText("Responsive");
    expect(heading).toHaveClass("text-3xl");
    expect(heading).toHaveClass("sm:text-4xl");
  });

  it("applies max-width constraint to description", () => {
    render(<SectionTitle title="Title" description="Constrained Description" />);
    const description = screen.getByText("Constrained Description");
    expect(description).toHaveClass("max-w-2xl");
  });
});
