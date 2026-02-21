import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import ResumeCardSkeleton, { ResumeCardSkeletonGrid, ResumeCardSkeletonList } from "../ResumeCardSkeleton";

describe("ResumeCardSkeleton Component", () => {
  describe("ResumeCardSkeleton", () => {
    it("renders skeleton card", () => {
      const { container } = render(<ResumeCardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("applies correct card container styles", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("h-56");
      expect(card).toHaveClass("w-full");
      expect(card).toHaveClass("rounded-2xl");
      expect(card).toHaveClass("border-2");
      expect(card).toHaveClass("bg-white");
    });

    it("renders with relative positioning", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("relative");
    });

    it("applies flex column layout", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("applies padding to card", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("p-6");
    });

    it("applies shadow and border styling", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("shadow-sm");
      expect(card).toHaveClass("border-slate-200/60");
    });

    it("renders with overflow hidden", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("overflow-hidden");
    });

    it("contains multiple Skeleton components", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const skeletons = container.querySelectorAll("output");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("renders icon placeholder at top", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const skeletons = container.querySelectorAll("output");
      const firstSkeleton = skeletons[0] as HTMLElement;
      expect(firstSkeleton).toHaveStyle({ width: "48px", height: "48px" });
    });

    it("has proper structure with divs for layout", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.firstChild as HTMLElement;
      const divs = card.querySelectorAll("div");
      expect(divs.length).toBeGreaterThan(0);
    });

    it("applies flex-1 to middle section", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const flexSection = container.querySelector(".flex-1");
      expect(flexSection).toBeInTheDocument();
    });

    it("applies spacing between elements", () => {
      const { container } = render(<ResumeCardSkeleton />);
      const spacedSection = container.querySelector(".space-y-2");
      expect(spacedSection).toBeInTheDocument();
    });
  });

  describe("ResumeCardSkeletonGrid", () => {
    it("renders grid with default count (5)", () => {
      const { container } = render(<ResumeCardSkeletonGrid />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(5);
    });

    it("renders grid with custom count", () => {
      const { container } = render(<ResumeCardSkeletonGrid count={3} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(3);
    });

    it("renders grid with large count", () => {
      const { container } = render(<ResumeCardSkeletonGrid count={10} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(10);
    });

    it("renders grid with count of 1", () => {
      const { container } = render(<ResumeCardSkeletonGrid count={1} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(1);
    });

    it("applies grid layout class", () => {
      const { container } = render(<ResumeCardSkeletonGrid />);
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass("grid");
    });

    it("applies responsive grid columns", () => {
      const { container } = render(<ResumeCardSkeletonGrid />);
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass("grid-cols-2");
      expect(grid).toHaveClass("sm:grid-cols-3");
      expect(grid).toHaveClass("lg:grid-cols-4");
      expect(grid).toHaveClass("xl:grid-cols-5");
    });

    it("applies gap between grid items", () => {
      const { container } = render(<ResumeCardSkeletonGrid />);
      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass("gap-4");
    });

    it("renders zero cards when count is 0", () => {
      const { container } = render(<ResumeCardSkeletonGrid count={0} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(0);
    });

    it("each card has unique key", () => {
      const { container } = render(<ResumeCardSkeletonGrid count={3} />);
      const grid = container.firstChild as HTMLElement;
      const children = Array.from(grid.children);
      expect(children.length).toBe(3);
    });

    it("maintains card structure in grid", () => {
      const { container } = render(<ResumeCardSkeletonGrid count={2} />);
      const cards = container.querySelectorAll(".h-56");
      cards.forEach((card) => {
        expect(card).toHaveClass("rounded-2xl");
        expect(card).toHaveClass("bg-white");
      });
    });
  });

  describe("ResumeCardSkeletonList", () => {
    it("renders list with default count (5)", () => {
      const { container } = render(<ResumeCardSkeletonList />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(5);
    });

    it("renders list with custom count", () => {
      const { container } = render(<ResumeCardSkeletonList count={3} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(3);
    });

    it("renders list with large count", () => {
      const { container } = render(<ResumeCardSkeletonList count={8} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(8);
    });

    it("renders list with count of 1", () => {
      const { container } = render(<ResumeCardSkeletonList count={1} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(1);
    });

    it("applies vertical spacing between list items", () => {
      const { container } = render(<ResumeCardSkeletonList />);
      const list = container.firstChild as HTMLElement;
      expect(list).toHaveClass("space-y-3");
    });

    it("does not use grid layout", () => {
      const { container } = render(<ResumeCardSkeletonList />);
      const list = container.firstChild as HTMLElement;
      expect(list).not.toHaveClass("grid");
    });

    it("renders zero cards when count is 0", () => {
      const { container } = render(<ResumeCardSkeletonList count={0} />);
      const skeletonCards = container.querySelectorAll(".h-56");
      expect(skeletonCards.length).toBe(0);
    });

    it("each card has unique key", () => {
      const { container } = render(<ResumeCardSkeletonList count={3} />);
      const list = container.firstChild as HTMLElement;
      const children = Array.from(list.children);
      expect(children.length).toBe(3);
    });

    it("maintains card structure in list", () => {
      const { container } = render(<ResumeCardSkeletonList count={2} />);
      const cards = container.querySelectorAll(".h-56");
      cards.forEach((card) => {
        expect(card).toHaveClass("rounded-2xl");
        expect(card).toHaveClass("bg-white");
      });
    });

    it("uses vertical layout instead of grid", () => {
      const { container } = render(<ResumeCardSkeletonList />);
      const list = container.firstChild as HTMLElement;
      expect(list).not.toHaveClass("grid-cols-2");
      expect(list).toHaveClass("space-y-3");
    });
  });
});
