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
 */
export default function Skeleton({ width, height, borderRadius, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

/** Skeleton preset for a line of text */
export function SkeletonText({ width = "100%", className = "" }: { width?: string | number; className?: string }) {
  return <Skeleton width={width} height={14} borderRadius={6} className={className} />;
}

/** Skeleton preset for a heading */
export function SkeletonHeading({ width = "60%", className = "" }: { width?: string | number; className?: string }) {
  return <Skeleton width={width} height={24} borderRadius={8} className={className} />;
}

/** Skeleton preset for a circular avatar */
export function SkeletonCircle({ size = 48, className = "" }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} borderRadius="50%" className={className} />;
}

/** Skeleton preset for a rectangular card */
export function SkeletonCard({ height = 200, className = "" }: { height?: string | number; className?: string }) {
  return <Skeleton width="100%" height={height} borderRadius={12} className={className} />;
}
