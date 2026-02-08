/**
 * Date formatting and manipulation utilities
 */

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

export function timeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const timeUnits = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  for (const { unit, seconds } of timeUnits) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Formats a date string to a human-readable format.
 * Supports both "YYYY-MM-DD" and legacy "YYYY-MM" formats.
 * - "YYYY-MM-DD" renders as "Mon DD, YYYY" (e.g., "Jan 15, 2020")
 * - "YYYY-MM" renders as "Mon YYYY" (e.g., "Jan 2020")
 * Returns an empty string if the input is invalid.
 */
export function formatShortDate(date: string): string {
  if (!date) return "";

  const parts = date.split("-");
  const yearNum = Number(parts[0]);
  const monthNum = Number(parts[1]);

  if (Number.isNaN(yearNum) || Number.isNaN(monthNum)) return "";

  // Full date format: YYYY-MM-DD
  if (parts.length >= 3 && parts[2]) {
    const dayNum = Number(parts[2]);
    if (!Number.isNaN(dayNum)) {
      return new Date(yearNum, monthNum - 1, dayNum).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  // Legacy format: YYYY-MM
  return new Date(yearNum, monthNum - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Parses a date string to a Date object.
 * Supports both "YYYY-MM-DD" and legacy "YYYY-MM" formats.
 * Returns undefined if the input is invalid.
 */
export function parseYearMonth(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  const parts = dateStr.split("-").map(Number);
  const [year, month, day] = parts;

  if (year === undefined || month === undefined || Number.isNaN(year) || Number.isNaN(month)) {
    return undefined;
  }

  // Full date format: YYYY-MM-DD
  if (day !== undefined && !Number.isNaN(day)) {
    return new Date(year, month - 1, day);
  }

  // Legacy format: YYYY-MM
  return new Date(year, month - 1);
}

/**
 * Formats a Date object to "YYYY-MM-DD" format string.
 * Returns an empty string if the date is undefined.
 */
export function formatFullDate(date: Date | undefined): string {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
