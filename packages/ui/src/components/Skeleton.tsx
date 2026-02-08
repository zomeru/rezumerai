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
export default function Skeleton({
  width,
  height,
  borderRadius,
  className = "",
  style,
}: SkeletonProps): React.JSX.Element {
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

interface SkeletonTextProps {
  width?: string | number;
  className?: string;
}

/** Skeleton preset for a line of text */
export function SkeletonText({ width = "100%", className = "" }: SkeletonTextProps): React.JSX.Element {
  return <Skeleton width={width} height={14} borderRadius={6} className={className} />;
}

interface SkeletonHeadingProps {
  width?: string | number;
  className?: string;
}

/** Skeleton preset for a heading */
export function SkeletonHeading({ width = "60%", className = "" }: SkeletonHeadingProps): React.JSX.Element {
  return <Skeleton width={width} height={24} borderRadius={8} className={className} />;
}

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

/** Skeleton preset for a circular avatar */
export function SkeletonCircle({ size = 48, className = "" }: SkeletonCircleProps): React.JSX.Element {
  return <Skeleton width={size} height={size} borderRadius="50%" className={className} />;
}

interface SkeletonCardProps {
  height?: string | number;
  className?: string;
}

/** Skeleton preset for a rectangular card */
export function SkeletonCard({ height = 200, className = "" }: SkeletonCardProps): React.JSX.Element {
  return <Skeleton width="100%" height={height} borderRadius={12} className={className} />;
}
