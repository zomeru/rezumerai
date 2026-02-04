"use client";

import { formatDate } from "@rezumerai/utils/date";
import { useClientDate } from "../hooks/useClientDate";

interface ClientDateProps {
  options?: Intl.DateTimeFormatOptions;
  prefix?: string;
  fallback?: string;
  className?: string;
}

/**
 * Component that safely displays the current date on client side
 * Prevents hydration mismatch by showing fallback during SSR
 */
export function ClientDate({
  options = { dateStyle: "full" },
  prefix = "",
  fallback = "Loading...",
  className,
}: ClientDateProps) {
  const currentDate = useClientDate();

  return (
    <span className={className}>
      {prefix}
      {currentDate ? formatDate(currentDate, options) : fallback}
    </span>
  );
}
