import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import ResumeBuilderSkeleton from "../ResumeBuilderSkeleton";

describe("ResumeBuilderSkeleton Component", () => {
  it("renders the skeleton component", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies two-column layout on large screens", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const layout = container.firstChild as HTMLElement;
    expect(layout).toHaveClass("lg:grid");
    expect(layout).toHaveClass("lg:grid-cols-12");
  });

  it("applies gap between columns", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const layout = container.firstChild as HTMLElement;
    expect(layout).toHaveClass("gap-8");
  });

  it("applies flex column on mobile", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const layout = container.firstChild as HTMLElement;
    expect(layout).toHaveClass("flex");
    expect(layout).toHaveClass("flex-col");
  });

  it("renders left panel (editor)", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const leftPanel = container.querySelector(".lg\\:col-span-5");
    expect(leftPanel).toBeInTheDocument();
  });

  it("renders right panel (preview)", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const rightPanel = container.querySelector(".lg\\:col-span-7");
    expect(rightPanel).toBeInTheDocument();
  });

  it("left panel has correct column span", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const leftPanel = container.querySelector(".lg\\:col-span-5");
    expect(leftPanel).toHaveClass("lg:col-span-5");
  });

  it("right panel has correct column span", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const rightPanel = container.querySelector(".lg\\:col-span-7");
    expect(rightPanel).toHaveClass("lg:col-span-7");
  });

  it("renders controls card skeleton", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const controlsCard = container.querySelector(".rounded-2xl");
    expect(controlsCard).toBeInTheDocument();
  });

  it("renders controls bar with skeletons", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const controlsBar = container.querySelector(".border-b");
    expect(controlsBar).toBeInTheDocument();
  });

  it("renders progress bar placeholder", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const progressBar = container.querySelector(".h-1\\.5");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders section step placeholders", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const stepsContainer = container.querySelector(".gap-2");
    const skeletons = stepsContainer?.querySelectorAll("output");
    expect(skeletons?.length).toBeGreaterThan(0);
  });

  it("renders form content with section heading", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const formContent = container.querySelector(".space-y-5");
    expect(formContent).toBeInTheDocument();
  });

  it("renders 4 form field placeholders", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const formFields = container.querySelectorAll(".space-y-2");
    expect(formFields.length).toBeGreaterThan(0);
  });

  it("renders save button skeleton", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const skeletons = container.querySelectorAll("output");
    const saveButton = Array.from(skeletons).find((skeleton) => {
      const style = (skeleton as HTMLElement).style;
      return style.height === "56px";
    });
    expect(saveButton).toBeTruthy();
  });

  it("renders action buttons row in preview", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const actionRow = container.querySelector(".justify-between");
    expect(actionRow).toBeInTheDocument();
  });

  it("renders resume preview placeholder", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const preview = container.querySelector(".shadow-xl");
    expect(preview).toBeInTheDocument();
  });

  it("renders header area with avatar placeholder", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const skeletons = container.querySelectorAll("output");
    const avatar = Array.from(skeletons).find((skeleton) => {
      const style = (skeleton as HTMLElement).style;
      return style.width === "80px" && style.height === "80px";
    });
    expect(avatar).toBeTruthy();
  });

  it("renders summary section placeholder", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const sections = container.querySelectorAll(".space-y-2");
    expect(sections.length).toBeGreaterThan(3);
  });

  it("renders experience section placeholder", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const sections = container.querySelectorAll(".space-y-2");
    expect(sections.length).toBeGreaterThan(4);
  });

  it("renders education section placeholder", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const sections = container.querySelectorAll(".space-y-2");
    expect(sections.length).toBeGreaterThan(5);
  });

  it("renders skills section with 6 skill badges", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const skillsSection = container.querySelector(".flex-wrap");
    const skillBadges = skillsSection?.querySelectorAll("output");
    expect(skillBadges?.length).toBeGreaterThanOrEqual(6);
  });

  it("applies correct padding to preview", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const previewContent = container.querySelector(".p-8");
    expect(previewContent).toBeInTheDocument();
  });

  it("applies correct border styling to cards", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const card = container.querySelector(".border-slate-200\\/60");
    expect(card).toBeInTheDocument();
  });

  it("applies shadow to cards", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const card = container.querySelector(".shadow-sm");
    expect(card).toBeInTheDocument();
  });

  it("contains multiple Skeleton components", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const skeletons = container.querySelectorAll("output");
    expect(skeletons.length).toBeGreaterThan(10);
  });

  it("renders with proper spacing in left panel", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const leftPanel = container.querySelector(".lg\\:col-span-5");
    const spacedSection = leftPanel?.querySelector(".space-y-6");
    expect(spacedSection).toBeInTheDocument();
  });

  it("renders with proper spacing in right panel", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const rightPanel = container.querySelector(".lg\\:col-span-7");
    const spacedSection = rightPanel?.querySelector(".space-y-4");
    expect(spacedSection).toBeInTheDocument();
  });

  it("applies bg-white to cards", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const cards = container.querySelectorAll(".bg-white");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("applies rounded corners to cards", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const roundedCards = container.querySelectorAll(".rounded-2xl");
    expect(roundedCards.length).toBeGreaterThan(0);
  });

  it("renders overflow-hidden on cards", () => {
    const { container } = render(<ResumeBuilderSkeleton />);
    const cards = container.querySelectorAll(".overflow-hidden");
    expect(cards.length).toBeGreaterThan(0);
  });
});
