"use client";

import { formatDate } from "@rezumerai/utils/date";
import { useClientDate } from "../hooks/useClientDate";

/**
 * Props for ClientDate component.
 *
 * @property options - Intl.DateTimeFormatOptions for date formatting (default: full)
 * @property prefix - Text prefix before the date string
 * @property fallback - Text shown during SSR before hydration (default: "Loading...")
 * @property className - Optional Tailwind classes for styling
 */
export interface ClientDateProps {
  options?: Intl.DateTimeFormatOptions;
  prefix?: string;
  fallback?: string;
  className?: string;
}

/**
 * Client-side date display component that prevents hydration mismatches.
 * Shows a fallback during SSR, then renders the formatted current date on the client.
 *
 * @param props - Date display configuration
 * @returns Span element with formatted date or fallback text
 *
 * @example
 * ```tsx
 * <ClientDate prefix="Today is " />
 * <ClientDate options={{ dateStyle: 'short' }} fallback="..." />
 * ```
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
