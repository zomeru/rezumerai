import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Skeleton, { SkeletonCard, SkeletonCircle, SkeletonHeading, SkeletonText } from "../Skeleton";

describe("Skeleton Component", () => {
  describe("Base Skeleton", () => {
    it("renders with default props", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton.tagName).toBe("OUTPUT");
    });

    it("applies width prop", () => {
      const { container } = render(<Skeleton width={200} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "200px" });
    });

    it("applies width as string", () => {
      const { container } = render(<Skeleton width="80%" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "80%" });
    });

    it("applies height prop", () => {
      const { container } = render(<Skeleton height={100} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: "100px" });
    });

    it("applies height as string", () => {
      const { container } = render(<Skeleton height="50px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: "50px" });
    });

    it("applies borderRadius prop", () => {
      const { container } = render(<Skeleton borderRadius={8} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ borderRadius: "8px" });
    });

    it("applies borderRadius as string", () => {
      const { container } = render(<Skeleton borderRadius="12px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ borderRadius: "12px" });
    });

    it("applies custom className", () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("custom-class");
    });

    it("applies default classes", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("bg-slate-200");
    });

    it("merges className with defaults", () => {
      const { container } = render(<Skeleton className="bg-gray-300" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("animate-pulse");
      expect(skeleton).toHaveClass("bg-gray-300");
    });

    it("applies custom style prop", () => {
      const { container } = render(<Skeleton style={{ opacity: 0.5 }} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ opacity: "0.5" });
    });

    it("merges custom style with dimension props", () => {
      const { container } = render(<Skeleton width={100} height={50} style={{ opacity: 0.7 }} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "100px", height: "50px", opacity: "0.7" });
    });

    it("has correct ARIA attributes for accessibility", () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute("aria-busy", "true");
      expect(skeleton).toHaveAttribute("aria-live", "polite");
      expect(skeleton).toHaveAttribute("aria-label", "Loading content");
    });

    it("contains sr-only loading text", () => {
      render(<Skeleton />);
      const loadingText = screen.getByText("Loading...");
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveClass("sr-only");
    });

    it("renders with all props combined", () => {
      const { container } = render(
        <Skeleton
          width="90%"
          height={120}
          borderRadius="10px"
          className="my-custom-skeleton"
          style={{ margin: "10px" }}
        />,
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({
        width: "90%",
        height: "120px",
        borderRadius: "10px",
        margin: "10px",
      });
      expect(skeleton).toHaveClass("my-custom-skeleton");
    });
  });

  describe("SkeletonText", () => {
    it("renders with default props", () => {
      const { container } = render(<SkeletonText />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: "100%", height: "14px", borderRadius: "6px" });
    });

    it("applies custom width", () => {
      const { container } = render(<SkeletonText width="80%" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "80%" });
    });

    it("applies custom width as number", () => {
      const { container } = render(<SkeletonText width={150} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "150px" });
    });

    it("applies custom className", () => {
      const { container } = render(<SkeletonText className="my-2" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("my-2");
    });

    it("maintains fixed height of 14px", () => {
      const { container } = render(<SkeletonText />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: "14px" });
    });

    it("maintains fixed borderRadius of 6px", () => {
      const { container } = render(<SkeletonText />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ borderRadius: "6px" });
    });

    it("has ARIA attributes", () => {
      const { container } = render(<SkeletonText />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("SkeletonHeading", () => {
    it("renders with default props", () => {
      const { container } = render(<SkeletonHeading />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: "60%", height: "24px", borderRadius: "8px" });
    });

    it("applies custom width", () => {
      const { container } = render(<SkeletonHeading width="50%" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "50%" });
    });

    it("applies custom width as number", () => {
      const { container } = render(<SkeletonHeading width={200} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "200px" });
    });

    it("applies custom className", () => {
      const { container } = render(<SkeletonHeading className="mb-4" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("mb-4");
    });

    it("maintains fixed height of 24px", () => {
      const { container } = render(<SkeletonHeading />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: "24px" });
    });

    it("maintains fixed borderRadius of 8px", () => {
      const { container } = render(<SkeletonHeading />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ borderRadius: "8px" });
    });

    it("has ARIA attributes", () => {
      const { container } = render(<SkeletonHeading />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("SkeletonCircle", () => {
    it("renders with default size", () => {
      const { container } = render(<SkeletonCircle />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: "48px", height: "48px", borderRadius: "50%" });
    });

    it("applies custom size", () => {
      const { container } = render(<SkeletonCircle size={64} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "64px", height: "64px" });
    });

    it("applies small size", () => {
      const { container } = render(<SkeletonCircle size={32} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "32px", height: "32px" });
    });

    it("applies large size", () => {
      const { container } = render(<SkeletonCircle size={100} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "100px", height: "100px" });
    });

    it("applies custom className", () => {
      const { container } = render(<SkeletonCircle className="mr-3" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("mr-3");
    });

    it("maintains 50% borderRadius for circular shape", () => {
      const { container } = render(<SkeletonCircle />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ borderRadius: "50%" });
    });

    it("has ARIA attributes", () => {
      const { container } = render(<SkeletonCircle />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("SkeletonCard", () => {
    it("renders with default props", () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveStyle({ width: "100%", height: "200px", borderRadius: "12px" });
    });

    it("applies custom height as number", () => {
      const { container } = render(<SkeletonCard height={300} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: "300px" });
    });

    it("applies custom height as string", () => {
      const { container } = render(<SkeletonCard height="250px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ height: "250px" });
    });

    it("applies custom className", () => {
      const { container } = render(<SkeletonCard className="mb-4" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("mb-4");
    });

    it("maintains fixed width of 100%", () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ width: "100%" });
    });

    it("maintains fixed borderRadius of 12px", () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveStyle({ borderRadius: "12px" });
    });

    it("has ARIA attributes", () => {
      const { container } = render(<SkeletonCard />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });
});
