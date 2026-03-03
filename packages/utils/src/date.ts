/**
 * Date formatting and manipulation utilities
 */

/**
 * Formats a date using Intl.DateTimeFormat with customizable options.
 * Accepts Date objects, ISO date strings, null, or undefined.
 *
 * @param date - Date object, ISO date string, null, or undefined to format
 * @param options - Optional Intl.DateTimeFormat configuration
 * @returns Formatted date string based on locale and options, or empty string if invalid
 *
 * @example
 * ```ts
 * formatDate(new Date('2024-01-15')) // => '1/15/2024' (default en-US)
 * formatDate('2024-01-15', { month: 'long', day: 'numeric', year: 'numeric' })
 * // => 'January 15, 2024'
 * formatDate(new Date(), { dateStyle: 'short' }) // => '1/15/24'
 * formatDate(null) // => ''
 * formatDate(undefined) // => ''
 * ```
 */
export function formatDate(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Converts a date to a human-readable relative time string (e.g., "5 minutes ago").
 * Automatically selects the most appropriate time unit from years to seconds.
 *
 * @param date - Date object, ISO date string, null, or undefined to convert
 * @returns Human-readable relative time string (e.g., "2 hours ago", "just now"), or empty string if invalid
 *
 * @example
 * ```ts
 * timeAgo(new Date(Date.now() - 5000)) // => "5 seconds ago"
 * timeAgo(new Date(Date.now() - 3600000)) // => "1 hour ago"
 * timeAgo(new Date(Date.now() - 86400000 * 2)) // => "2 days ago"
 * timeAgo(new Date()) // => "just now"
 * timeAgo(null) // => ''
 * ```
 */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return "";
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
 * @param date - Base date to add days to (Date, null, or undefined)
 * @param days - Number of days to add (negative values subtract days)
 * @returns New Date object with the added/subtracted days, or undefined if input is invalid
 *
 * @example
 * ```ts
 * const today = new Date('2024-01-15');
 * addDays(today, 7) // => Date('2024-01-22')
 * addDays(today, -3) // => Date('2024-01-12')
 * addDays(today, 0) // => Date('2024-01-15')
 * addDays(null, 7) // => undefined
 * ```
 */
export function addDays(date: Date | null | undefined, days: number): Date | undefined {
  if (!date) return undefined;
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks if a given date is today's date.
 * Compares day, month, and year components only (ignores time).
 *
 * @param date - Date object, ISO date string, null, or undefined to check
 * @returns True if the date is today, false otherwise (returns false for null/undefined)
 *
 * @example
 * ```ts
 * isToday(new Date()) // => true
 * isToday('2024-01-15') // => true (if today is Jan 15, 2024)
 * isToday(new Date('2024-01-14')) // => false (if today is Jan 15, 2024)
 * isToday(new Date(Date.now() - 86400000)) // => false (yesterday)
 * isToday(null) // => false
 * ```
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return false;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Formats a date to a human-readable short format.
 * Supports Date objects, "YYYY-MM-DD", and legacy "YYYY-MM" formats.
 * - Date objects and "YYYY-MM-DD" render as "Mon DD, YYYY" (e.g., "Jan 15, 2020")
 * - "YYYY-MM" renders as "Mon YYYY" (e.g., "Jan 2020")
 *
 * @param dateInput - Date object, date string in "YYYY-MM-DD" or "YYYY-MM" format, null, or undefined
 * @returns Formatted short date string, or empty string if input is invalid
 *
 * @example
 * ```ts
 * formatShortDate(new Date(2020, 0, 15)) // => 'Jan 15, 2020'
 * formatShortDate('2020-01-15') // => 'Jan 15, 2020'
 * formatShortDate('2020-01')    // => 'Jan 2020'
 * formatShortDate(null)         // => ''
 * formatShortDate(undefined)     // => ''
 * ```
 */
export function formatShortDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";

  let dateObj: Date;

  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return "";
    dateObj = dateInput;
  } else if (typeof dateInput === "string") {
    const parts = dateInput.split("-").map((p) => Number(p));
    const [year, month, day] = parts;

    if (parts.length < 1 || typeof year !== "number" || !Number.isInteger(year)) return "";

    if (parts.length === 1) {
      dateObj = new Date(year, 0, 1);
    } else if (
      parts.length === 2 &&
      typeof month === "number" &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12
    ) {
      dateObj = new Date(year, month - 1, 1);
    } else if (
      parts.length >= 3 &&
      typeof month === "number" &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12 &&
      typeof day === "number" &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= 31
    ) {
      dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
        return "";
      }
    } else {
      return "";
    }
  } else {
    return "";
  }

  if (dateObj.getDate() === 1 && dateObj.getMonth() === 0) {
    return dateObj.toLocaleDateString("en-US", { year: "numeric" });
  } else if (dateObj.getDate() === 1) {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } else {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

/**
 * Parses a date string in "YYYY-MM-DD" or "YYYY-MM" format into a Date object.
 * Also accepts Date objects (pass-through).
 *
 * @param dateInput - Date string in "YYYY-MM-DD" or "YYYY-MM" format, or Date object
 * @returns Parsed Date object, or undefined if the input is invalid or empty
 *
 * @example
 * ```ts
 * parseYearMonth('2024-06-15') // => Date(2024, 5, 15)
 * parseYearMonth('2024-06')    // => Date(2024, 5, 1)
 * parseYearMonth('')           // => undefined
 * parseYearMonth(new Date())   // => Date (pass-through)
 * ```
 */
export function parseYearMonth(dateInput: string | Date | null | undefined): Date | undefined {
  if (!dateInput) return undefined;

  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? undefined : dateInput;
  }

  if (typeof dateInput !== "string") return undefined;

  const parts = dateInput.split("-").map((p) => Number(p));

  const [year, month, day] = parts;

  if (parts.length < 1 || typeof year !== "number" || !Number.isInteger(year)) return undefined;

  if (parts.length === 1) {
    return new Date(year, 0, 1);
  }

  if (parts.length === 2 && typeof month === "number" && Number.isInteger(month) && month >= 1 && month <= 12) {
    return new Date(year, month - 1, 1);
  }

  if (
    parts.length === 3 &&
    typeof month === "number" &&
    typeof day === "number" &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }

  return undefined;
}

/**
 * Formats a Date object to "YYYY-MM-DD" ISO-style string.
 *
 * @param date - Date object, null, or undefined to format
 * @returns Formatted date string in "YYYY-MM-DD" format, or empty string if date is null/undefined
 *
 * @example
 * ```ts
 * formatFullDate(new Date(2024, 0, 15)) // => '2024-01-15'
 * formatFullDate(null)                   // => ''
 * formatFullDate(undefined)              // => ''
 * ```
 */
export function formatFullDate(date: Date | null | undefined): string {
  if (!date) return "";
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Safely checks if a date is valid.
 *
 * @param date - Date object, null, or undefined to validate
 * @returns True if the date is a valid Date object, false otherwise
 *
 * @example
 * ```ts
 * isValidDate(new Date()) // => true
 * isValidDate(null) // => false
 * isValidDate(new Date('invalid')) // => false
 * ```
 */
export function isValidDate(date: Date | null | undefined): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * Compares two dates for sorting (ascending).
 *
 * @param a - First date to compare
 * @param b - Second date to compare
 * @returns -1 if a < b, 1 if a > b, 0 if equal (or both invalid)
 *
 * @example
 * ```ts
 * compareDates(new Date(2020, 0, 1), new Date(2020, 0, 2)) // => -1
 * compareDates(null, new Date()) // => 1 (valid dates sort first)
 * ```
 */
export function compareDates(a: Date | null | undefined, b: Date | null | undefined): number {
  if (!isValidDate(a) && !isValidDate(b)) return 0;
  if (!isValidDate(a)) return 1;
  if (!isValidDate(b)) return -1;
  return a.getTime() - b.getTime();
}

/**
 * Formats a date range with optional "Present" text for current positions.
 *
 * @param startDate - Start date (Date, null, or undefined)
 * @param endDate - End date (Date, null, or undefined) - pass null for current/present
 * @param isCurrent - Whether this is a current position
 * @returns Formatted date range string (e.g., "Jan 2020 - Present", "Jan 2020 - Dec 2022")
 *
 * @example
 * ```ts
 * formatDateRange(new Date(2020, 0, 1), null, true) // => 'Jan 2020 - Present'
 * formatDateRange(new Date(2020, 0, 1), new Date(2022, 11, 1), false) // => 'Jan 2020 - Dec 2022'
 * formatDateRange(null, null, false) // => ''
 * ```
 */
export function formatDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  isCurrent: boolean,
): string {
  const startStr = formatShortDate(startDate);
  if (!startStr) return "";

  if (isCurrent || !isValidDate(endDate)) {
    return `${startStr} - Present`;
  }

  const endStr = formatShortDate(endDate);
  if (!endStr) return startStr;

  return `${startStr} - ${endStr}`;
}

/**
 * Converts a Date to the first day of the month (useful for date pickers).
 *
 * @param date - Date object to convert
 * @returns New Date set to first day of the month
 *
 * @example
 * ```ts
 * toMonthStart(new Date(2024, 5, 15)) // => Date(2024, 5, 1)
 * ```
 */
export function toMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
