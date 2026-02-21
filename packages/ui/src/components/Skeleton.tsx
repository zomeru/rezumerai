import { cn } from "@rezumerai/utils";
import type React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable skeleton loader component for indicating loading states.
 * Renders a pulsing placeholder that can be customized in size and shape.
 * Includes proper ARIA attributes for accessibility.
 */
export default function Skeleton({ width, height, borderRadius, className = "", style }: SkeletonProps) {
  return (
    <output
      className={cn("animate-pulse bg-slate-200", className)}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </output>
  );
}

/**
 * Props for SkeletonText component.
 *
 * @property width - Optional width (default: "100%")
 * @property className - Optional Tailwind classes
 */
interface SkeletonTextProps {
  width?: string | number;
  className?: string;
}

/**
 * Skeleton preset for a line of text.
 * Renders with standard text height (14px) and rounded corners.
 *
 * @param props - SkeletonText configuration
 * @returns Text skeleton loader
 *
 * @example
 * ```tsx
 * <SkeletonText width="80%" />
 * <SkeletonText className="my-2" />
 * ```
 */
export function SkeletonText({ width = "100%", className = "" }: SkeletonTextProps) {
  return <Skeleton width={width} height={14} borderRadius={6} className={className} />;
}

/**
 * Props for SkeletonHeading component.
 *
 * @property width - Optional width (default: "60%")
 * @property className - Optional Tailwind classes
 */
interface SkeletonHeadingProps {
  width?: string | number;
  className?: string;
}

/**
 * Skeleton preset for a heading.
 * Renders with heading height (24px) and slightly larger border radius.
 *
 * @param props - SkeletonHeading configuration
 * @returns Heading skeleton loader
 *
 * @example
 * ```tsx
 * <SkeletonHeading width="50%" />
 * <SkeletonHeading className="mb-4" />
 * ```
 */
export function SkeletonHeading({ width = "60%", className = "" }: SkeletonHeadingProps) {
  return <Skeleton width={width} height={24} borderRadius={8} className={className} />;
}

/**
 * Props for SkeletonCircle component.
 *
 * @property size - Optional diameter in pixels (default: 48)
 * @property className - Optional Tailwind classes
 */
interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

/**
 * Skeleton preset for a circular avatar or profile image.
 * Renders as a perfect circle with 50% border radius.
 *
 * @param props - SkeletonCircle configuration
 * @returns Circular skeleton loader
 *
 * @example
 * ```tsx
 * <SkeletonCircle size={64} />
 * <SkeletonCircle className="mr-3" />
 * ```
 */
export function SkeletonCircle({ size = 48, className = "" }: SkeletonCircleProps) {
  return <Skeleton width={size} height={size} borderRadius="50%" className={className} />;
}

/**
 * Props for SkeletonCard component.
 *
 * @property height - Optional height in pixels or string (default: 200)
 * @property className - Optional Tailwind classes
 */
interface SkeletonCardProps {
  height?: string | number;
  className?: string;
}

/**
 * Skeleton preset for a rectangular card.
 * Renders full width with customizable height and rounded corners.
 *
 * @param props - SkeletonCard configuration
 * @returns Card skeleton loader
 *
 * @example
 * ```tsx
 * <SkeletonCard height={300} />
 * <SkeletonCard className="mb-4" />
 * ```
 */
export function SkeletonCard({ height = 200, className = "" }: SkeletonCardProps) {
  return <Skeleton width="100%" height={height} borderRadius={12} className={className} />;
}
