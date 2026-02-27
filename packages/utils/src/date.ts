/**
 * Date formatting and manipulation utilities
 */

/**
 * Formats a date using Intl.DateTimeFormat with customizable options.
 * Accepts both Date objects and ISO date strings.
 *
 * @param date - Date object or ISO date string to format
 * @param options - Optional Intl.DateTimeFormat configuration
 * @returns Formatted date string based on locale and options
 *
 * @example
 * ```ts
 * formatDate(new Date('2024-01-15')) // => '1/15/2024' (default en-US)
 * formatDate('2024-01-15', { month: 'long', day: 'numeric', year: 'numeric' })
 * // => 'January 15, 2024'
 * formatDate(new Date(), { dateStyle: 'short' }) // => '1/15/24'
 * ```
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Converts a date to a human-readable relative time string (e.g., "5 minutes ago").
 * Automatically selects the most appropriate time unit from years to seconds.
 *
 * @param date - Date object or ISO date string to convert
 * @returns Human-readable relative time string (e.g., "2 hours ago", "just now")
 *
 * @example
 * ```ts
 * timeAgo(new Date(Date.now() - 5000)) // => "5 seconds ago"
 * timeAgo(new Date(Date.now() - 3600000)) // => "1 hour ago"
 * timeAgo(new Date(Date.now() - 86400000 * 2)) // => "2 days ago"
 * timeAgo(new Date()) // => "just now"
 * ```
 */
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

/**
 * Adds or subtracts a specified number of days from a date.
 * Returns a new Date object without mutating the original.
 *
 * @param date - Base date to add days to
 * @param days - Number of days to add (negative values subtract days)
 * @returns New Date object with the added/subtracted days
 *
 * @example
 * ```ts
 * const today = new Date('2024-01-15');
 * addDays(today, 7) // => Date('2024-01-22')
 * addDays(today, -3) // => Date('2024-01-12')
 * addDays(today, 0) // => Date('2024-01-15')
 * ```
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks if a given date is today's date.
 * Compares day, month, and year components only (ignores time).
 *
 * @param date - Date object or ISO date string to check
 * @returns True if the date is today, false otherwise
 *
 * @example
 * ```ts
 * isToday(new Date()) // => true
 * isToday('2024-01-15') // => true (if today is Jan 15, 2024)
 * isToday(new Date('2024-01-14')) // => false (if today is Jan 15, 2024)
 * isToday(new Date(Date.now() - 86400000)) // => false (yesterday)
 * ```
 */
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
 * Formats a date string to a human-readable short format.
 * Supports both "YYYY-MM-DD" and legacy "YYYY-MM" formats.
 * - "YYYY-MM-DD" renders as "Mon DD, YYYY" (e.g., "Jan 15, 2020")
 * - "YYYY-MM" renders as "Mon YYYY" (e.g., "Jan 2020")
 *
 * @param date - Date string in "YYYY-MM-DD" or "YYYY-MM" format
 * @returns Formatted short date string, or empty string if input is invalid
 *
 * @example
 * ```ts
 * formatShortDate('2020-01-15') // => 'Jan 15, 2020'
 * formatShortDate('2020-01')    // => 'Jan 2020'
 * formatShortDate('')           // => ''
 * ```
 */
export function formatShortDate(dateInput: string | Date): string {
  if (!dateInput) return "";

  let dateObj: Date;

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === "string") {
    const parts = dateInput.split("-").map((p) => Number(p));
    const [year, month, day] = parts;

    if (!Number.isInteger(year)) return "";

    if (parts.length === 1) {
      dateObj = new Date(year, 0, 1);
    } else if (parts.length === 2 && Number.isInteger(month) && month >= 1 && month <= 12) {
      dateObj = new Date(year, month - 1, 1);
    } else if (
      parts.length >= 3 &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12 &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= 31
    ) {
      dateObj = new Date(year, month - 1, day);
      // Validate JS date overflow
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
        return "";
      }
    } else {
      return "";
    }
  } else {
    return "";
  }

  // Format the date
  if (dateObj.getDate() === 1 && dateObj.getMonth() === 0) {
    // Only year
    return dateObj.toLocaleDateString("en-US", { year: "numeric" });
  } else if (dateObj.getDate() === 1) {
    // Year + Month
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } else {
    // Full date
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

/**
 * Parses a date string in "YYYY-MM-DD" or "YYYY-MM" format into a Date object.
 *
 * @param dateStr - Date string in "YYYY-MM-DD" or "YYYY-MM" format
 * @returns Parsed Date object, or undefined if the input is invalid or empty
 *
 * @example
 * ```ts
 * parseYearMonth('2024-06-15') // => Date(2024, 5, 15)
 * parseYearMonth('2024-06')    // => Date(2024, 5, 1)
 * parseYearMonth('')           // => undefined
 * ```
 */
export function parseYearMonth(dateStr: string): Date | undefined {
  if (!dateStr || typeof dateStr !== "string") return undefined;

  const parts = dateStr.split("-").map((p) => Number(p));

  const [year, month, day] = parts;

  // Year is mandatory
  if (!Number.isInteger(year)) return undefined;

  // YYYY
  if (parts.length === 1) {
    return new Date(year, 0, 1);
  }

  // YYYY-MM
  if (parts.length === 2 && Number.isInteger(month) && month >= 1 && month <= 12) {
    return new Date(year, month - 1, 1);
  }

  // YYYY-MM-DD
  if (
    parts.length === 3 &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    const date = new Date(year, month - 1, day);

    // Guard against JS date overflow (e.g. 2024-02-31)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }

  return undefined;
}

/**
 * Formats a Date object to "YYYY-MM-DD" ISO-style string.
 *
 * @param date - Date object to format, or undefined
 * @returns Formatted date string in "YYYY-MM-DD" format, or empty string if date is undefined
 *
 * @example
 * ```ts
 * formatFullDate(new Date(2024, 0, 15)) // => '2024-01-15'
 * formatFullDate(undefined)             // => ''
 * ```
 */
export function formatFullDate(date: Date | undefined): string {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
