import { afterEach, beforeEach, describe, expect, it, setSystemTime } from "bun:test";
import { addDays, formatDate, formatFullDate, formatShortDate, isToday, parseYearMonth, timeAgo } from "../date";

describe("date utilities", () => {
  describe("formatDate", () => {
    it("formats Date object with default options", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/1\/15\/2024/);
    });

    it("formats ISO string with default options", () => {
      const result = formatDate("2024-01-15");
      expect(result).toMatch(/1\/15\/2024/);
    });

    it("formats with custom options - long format", () => {
      const date = new Date("2024-01-15");
      const result = formatDate(date, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      expect(result).toBe("January 15, 2024");
    });

    it("formats with dateStyle option", () => {
      const date = new Date("2024-01-15");
      const result = formatDate(date, { dateStyle: "short" });
      expect(result).toMatch(/1\/15\/24/);
    });

    it("formats with timeStyle option", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = formatDate(date, {
        hour: "numeric",
        minute: "numeric",
      });
      expect(result).toContain(":");
    });
  });

  describe("timeAgo", () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      originalDate = global.Date;
      const mockDate = new Date("2024-01-15T12:00:00Z");
      setSystemTime(mockDate);
    });

    afterEach(() => {
      setSystemTime();
      global.Date = originalDate;
    });

    it("returns 'just now' for current time", () => {
      const now = new Date();
      expect(timeAgo(now)).toBe("just now");
    });

    it("returns 'just now' for time less than 1 second ago", () => {
      const date = new Date(Date.now() - 500);
      expect(timeAgo(date)).toBe("just now");
    });

    it("returns seconds ago", () => {
      const date = new Date(Date.now() - 5000);
      expect(timeAgo(date)).toBe("5 seconds ago");
    });

    it("returns singular second ago", () => {
      const date = new Date(Date.now() - 1000);
      expect(timeAgo(date)).toBe("1 second ago");
    });

    it("returns minutes ago", () => {
      const date = new Date(Date.now() - 120000); // 2 minutes
      expect(timeAgo(date)).toBe("2 minutes ago");
    });

    it("returns singular minute ago", () => {
      const date = new Date(Date.now() - 60000);
      expect(timeAgo(date)).toBe("1 minute ago");
    });

    it("returns hours ago", () => {
      const date = new Date(Date.now() - 7200000); // 2 hours
      expect(timeAgo(date)).toBe("2 hours ago");
    });

    it("returns singular hour ago", () => {
      const date = new Date(Date.now() - 3600000);
      expect(timeAgo(date)).toBe("1 hour ago");
    });

    it("returns days ago", () => {
      const date = new Date(Date.now() - 172800000); // 2 days
      expect(timeAgo(date)).toBe("2 days ago");
    });

    it("returns singular day ago", () => {
      const date = new Date(Date.now() - 86400000);
      expect(timeAgo(date)).toBe("1 day ago");
    });

    it("returns weeks ago", () => {
      const date = new Date(Date.now() - 1209600000); // 2 weeks
      expect(timeAgo(date)).toBe("2 weeks ago");
    });

    it("returns singular week ago", () => {
      const date = new Date(Date.now() - 604800000);
      expect(timeAgo(date)).toBe("1 week ago");
    });

    it("returns months ago", () => {
      const date = new Date(Date.now() - 5184000000); // 2 months
      expect(timeAgo(date)).toBe("2 months ago");
    });

    it("returns singular month ago", () => {
      const date = new Date(Date.now() - 2592000000);
      expect(timeAgo(date)).toBe("1 month ago");
    });

    it("returns years ago", () => {
      const date = new Date(Date.now() - 63072000000); // 2 years
      expect(timeAgo(date)).toBe("2 years ago");
    });

    it("returns singular year ago", () => {
      const date = new Date(Date.now() - 31536000000);
      expect(timeAgo(date)).toBe("1 year ago");
    });

    it("handles ISO string input", () => {
      const isoString = new Date(Date.now() - 3600000).toISOString();
      expect(timeAgo(isoString)).toBe("1 hour ago");
    });
  });

  describe("addDays", () => {
    it("adds positive days to a date", () => {
      const date = new Date("2024-01-15");
      const result = addDays(date, 7);
      expect(result.getDate()).toBe(22);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it("subtracts days with negative value", () => {
      const date = new Date("2024-01-15");
      const result = addDays(date, -3);
      expect(result.getDate()).toBe(12);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it("returns same date when adding 0 days", () => {
      const date = new Date("2024-01-15");
      const result = addDays(date, 0);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it("does not mutate original date", () => {
      const date = new Date("2024-01-15");
      const originalDate = date.getDate();
      addDays(date, 5);
      expect(date.getDate()).toBe(originalDate);
    });

    it("handles month overflow", () => {
      const date = new Date("2024-01-30");
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1); // February
    });

    it("handles year overflow", () => {
      const date = new Date("2024-12-30");
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
    });

    it("handles large day values", () => {
      const date = new Date("2024-01-01");
      const result = addDays(date, 366); // 2024 is a leap year
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe("isToday", () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      originalDate = global.Date;
      const mockDate = new Date("2024-01-15T12:00:00Z");
      setSystemTime(mockDate);
    });

    afterEach(() => {
      setSystemTime();
      global.Date = originalDate;
    });

    it("returns true for current date", () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it("returns true for today at different time", () => {
      // Using local time (no Z suffix) to ensure same day
      const morning = new Date("2024-01-15T08:00:00");
      const evening = new Date("2024-01-15T20:00:00");
      expect(isToday(morning)).toBe(true);
      expect(isToday(evening)).toBe(true);
    });

    it("returns false for yesterday", () => {
      const yesterday = new Date(Date.now() - 86400000);
      expect(isToday(yesterday)).toBe(false);
    });

    it("returns false for tomorrow", () => {
      const tomorrow = new Date(Date.now() + 86400000);
      expect(isToday(tomorrow)).toBe(false);
    });

    it("returns false for different month", () => {
      const differentMonth = new Date("2024-02-15");
      expect(isToday(differentMonth)).toBe(false);
    });

    it("returns false for different year", () => {
      const differentYear = new Date("2025-01-15");
      expect(isToday(differentYear)).toBe(false);
    });

    it("handles ISO string input", () => {
      expect(isToday("2024-01-15")).toBe(true);
      expect(isToday("2024-01-14")).toBe(false);
    });
  });

  describe("formatShortDate", () => {
    it("formats full date YYYY-MM-DD", () => {
      expect(formatShortDate("2020-01-15")).toBe("Jan 15, 2020");
    });

    it("formats legacy YYYY-MM format", () => {
      expect(formatShortDate("2020-01")).toBe("Jan 2020");
    });

    it("returns empty string for empty input", () => {
      expect(formatShortDate("")).toBe("");
    });

    it("returns empty string for invalid year", () => {
      expect(formatShortDate("abc-01-15")).toBe("");
    });

    it("returns empty string for invalid month", () => {
      expect(formatShortDate("2020-abc-15")).toBe("");
    });

    it("handles month at end of year", () => {
      expect(formatShortDate("2020-12-31")).toBe("Dec 31, 2020");
    });

    it("handles month at start of year", () => {
      expect(formatShortDate("2020-01-01")).toBe("Jan 1, 2020");
    });

    it("handles legacy format with different months", () => {
      expect(formatShortDate("2020-06")).toBe("Jun 2020");
      expect(formatShortDate("2020-12")).toBe("Dec 2020");
    });

    it("handles invalid day in full format", () => {
      expect(formatShortDate("2020-01-abc")).toBe("Jan 2020");
    });

    it("handles dates with single digit month and day", () => {
      expect(formatShortDate("2020-1-5")).toBe("Jan 5, 2020");
    });
  });

  describe("parseYearMonth", () => {
    it("parses full date YYYY-MM-DD", () => {
      const result = parseYearMonth("2024-06-15");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(5); // 0-indexed
      expect(result?.getDate()).toBe(15);
    });

    it("parses legacy YYYY-MM format", () => {
      const result = parseYearMonth("2024-06");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(5);
      expect(result?.getDate()).toBe(1); // Defaults to 1st
    });

    it("returns undefined for empty string", () => {
      expect(parseYearMonth("")).toBeUndefined();
    });

    it("returns undefined for invalid year", () => {
      expect(parseYearMonth("abc-06-15")).toBeUndefined();
    });

    it("returns undefined for invalid month", () => {
      expect(parseYearMonth("2024-abc-15")).toBeUndefined();
    });

    it("returns undefined for missing month", () => {
      expect(parseYearMonth("2024")).toBeUndefined();
    });

    it("handles dates at year boundaries", () => {
      const result = parseYearMonth("2024-01-01");
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
    });

    it("handles dates at month boundaries", () => {
      const result = parseYearMonth("2024-12-31");
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(31);
    });

    it("handles legacy format for different months", () => {
      const jan = parseYearMonth("2024-01");
      const dec = parseYearMonth("2024-12");
      expect(jan?.getMonth()).toBe(0);
      expect(dec?.getMonth()).toBe(11);
    });
  });

  describe("formatFullDate", () => {
    it("formats Date object to YYYY-MM-DD", () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatFullDate(date)).toBe("2024-01-15");
    });

    it("returns empty string for undefined", () => {
      expect(formatFullDate(undefined)).toBe("");
    });

    it("pads single digit month with zero", () => {
      const date = new Date(2024, 0, 1); // Jan 1, 2024
      expect(formatFullDate(date)).toBe("2024-01-01");
    });

    it("pads single digit day with zero", () => {
      const date = new Date(2024, 11, 5); // Dec 5, 2024
      expect(formatFullDate(date)).toBe("2024-12-05");
    });

    it("handles double digit month and day", () => {
      const date = new Date(2024, 11, 31); // Dec 31, 2024
      expect(formatFullDate(date)).toBe("2024-12-31");
    });

    it("handles year boundaries", () => {
      const date = new Date(2024, 0, 1); // Jan 1, 2024
      expect(formatFullDate(date)).toBe("2024-01-01");
    });

    it("handles leap year dates", () => {
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      expect(formatFullDate(date)).toBe("2024-02-29");
    });

    it("handles different years", () => {
      const date1 = new Date(2020, 5, 15);
      const date2 = new Date(2025, 5, 15);
      expect(formatFullDate(date1)).toBe("2020-06-15");
      expect(formatFullDate(date2)).toBe("2025-06-15");
    });
  });
});
