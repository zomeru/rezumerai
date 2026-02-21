import { describe, expect, it } from "bun:test";
import { capitalize, formatBytes, slugify, truncate } from "../string";

describe("string utilities", () => {
  describe("capitalize", () => {
    it("capitalizes first letter of lowercase string", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("capitalizes and lowercases rest of uppercase string", () => {
      expect(capitalize("WORLD")).toBe("World");
    });

    it("handles mixed case strings", () => {
      expect(capitalize("hELLo")).toBe("Hello");
    });

    it("handles single character string", () => {
      expect(capitalize("a")).toBe("A");
      expect(capitalize("Z")).toBe("Z");
    });

    it("handles empty string", () => {
      expect(capitalize("")).toBe("");
    });

    it("handles strings starting with space", () => {
      expect(capitalize(" hello")).toBe(" hello");
    });

    it("handles strings with numbers", () => {
      expect(capitalize("123abc")).toBe("123abc");
    });

    it("handles strings with special characters", () => {
      expect(capitalize("!hello")).toBe("!hello");
    });

    it("only affects first character", () => {
      expect(capitalize("hello WORLD")).toBe("Hello world");
    });
  });

  describe("truncate", () => {
    it("truncates long string with default suffix", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
    });

    it("returns original string if under length", () => {
      expect(truncate("Short", 10)).toBe("Short");
    });

    it("returns original string if exactly at length", () => {
      expect(truncate("Exact", 5)).toBe("Exact");
    });

    it("truncates with custom suffix", () => {
      expect(truncate("Hello World", 8, "…")).toBe("Hello W…");
    });

    it("handles empty suffix", () => {
      expect(truncate("Hello World", 5, "")).toBe("Hello");
    });

    it("handles long suffix", () => {
      expect(truncate("Hello World", 10, " [more]")).toBe("Hel [more]");
    });

    it("truncates to minimum length with suffix", () => {
      expect(truncate("Hello", 3)).toBe("...");
    });

    it("handles empty string", () => {
      expect(truncate("", 10)).toBe("");
    });

    it("handles single character string", () => {
      expect(truncate("A", 5)).toBe("A");
    });

    it("handles Unicode characters", () => {
      // Emoji is 2 code units, gets split when truncated
      const result = truncate("Hello 👋 World", 10);
      expect(result).toBe("Hello \ud83d...");
    });

    it("handles suffix longer than length", () => {
      // When suffix length >= target length, result includes what fits
      expect(truncate("Hello", 4, "...")).toBe("H...");
    });
  });

  describe("slugify", () => {
    it("converts simple string to slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("trims whitespace", () => {
      expect(slugify("  My Blog Post  ")).toBe("my-blog-post");
    });

    it("removes special characters", () => {
      expect(slugify("Hello! World?")).toBe("hello-world");
    });

    it("converts multiple spaces to single hyphen", () => {
      expect(slugify("Hello    World")).toBe("hello-world");
    });

    it("handles strings with hyphens", () => {
      expect(slugify("Hello-World")).toBe("hello-world");
    });

    it("handles underscores", () => {
      expect(slugify("Hello_World")).toBe("hello_world");
    });

    it("removes leading/trailing special characters", () => {
      expect(slugify("!Hello World!")).toBe("hello-world");
    });

    it("handles numbers", () => {
      expect(slugify("Article 123")).toBe("article-123");
    });

    it("handles mixed case and special chars", () => {
      expect(slugify("My Blog Post #1!")).toBe("my-blog-post-1");
    });

    it("handles empty string", () => {
      expect(slugify("")).toBe("");
    });

    it("handles string with only special characters", () => {
      expect(slugify("!@#$%")).toBe("");
    });

    it("handles string with only spaces", () => {
      expect(slugify("   ")).toBe("");
    });

    it("handles Unicode characters (removes them)", () => {
      expect(slugify("Hello 👋 World")).toBe("hello--world");
    });

    it("handles apostrophes and quotes", () => {
      expect(slugify("Don't Stop Believin'")).toBe("dont-stop-believin");
    });

    it("handles ampersands", () => {
      expect(slugify("Tom & Jerry")).toBe("tom--jerry");
    });

    it("handles parentheses", () => {
      expect(slugify("Hello (World)")).toBe("hello-world");
    });

    it("handles dots and commas", () => {
      expect(slugify("Hello, World.")).toBe("hello-world");
    });
  });

  describe("formatBytes", () => {
    it("formats zero bytes", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
    });

    it("formats bytes (less than 1 KB)", () => {
      expect(formatBytes(500)).toBe("500 Bytes");
      expect(formatBytes(1023)).toBe("1023 Bytes");
    });

    it("formats kilobytes", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(2048)).toBe("2 KB");
    });

    it("formats megabytes", () => {
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(5242880)).toBe("5 MB");
    });

    it("formats gigabytes", () => {
      expect(formatBytes(1073741824)).toBe("1 GB");
      expect(formatBytes(2147483648)).toBe("2 GB");
    });

    it("formats terabytes", () => {
      expect(formatBytes(1099511627776)).toBe("1 TB");
    });

    it("handles decimal places with default precision", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1234567)).toBe("1.18 MB");
    });

    it("handles custom decimal places", () => {
      expect(formatBytes(1234567, 1)).toBe("1.2 MB");
      expect(formatBytes(1234567, 3)).toBe("1.177 MB");
    });

    it("handles zero decimal places", () => {
      expect(formatBytes(1234567, 0)).toBe("1 MB");
    });

    it("handles negative decimal places (treats as zero)", () => {
      expect(formatBytes(1234567, -1)).toBe("1 MB");
    });

    it("formats petabytes", () => {
      expect(formatBytes(1125899906842624)).toBe("1 PB");
    });

    it("formats exabytes", () => {
      expect(formatBytes(1024 ** 6)).toBe("1 EB");
    });

    it("formats zettabytes", () => {
      expect(formatBytes(1024 ** 7)).toBe("1 ZB");
    });

    it("handles very small KB values", () => {
      expect(formatBytes(1500, 2)).toBe("1.46 KB");
    });

    it("handles exact power of 1024", () => {
      expect(formatBytes(1024 ** 2)).toBe("1 MB");
      expect(formatBytes(1024 ** 3)).toBe("1 GB");
    });

    it("handles large file sizes", () => {
      expect(formatBytes(999999999999)).toBe("931.32 GB");
    });

    it("rounds correctly", () => {
      expect(formatBytes(1536, 0)).toBe("2 KB");
      expect(formatBytes(1536, 1)).toBe("1.5 KB");
    });
  });
});
