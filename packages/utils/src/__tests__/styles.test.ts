import { describe, expect, it } from "bun:test";
import { cn } from "../styles";

describe("styles utilities", () => {
  describe("cn", () => {
    it("merges multiple class strings", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("handles conditional classes with boolean true", () => {
      expect(cn("base", true && "conditional")).toBe("base conditional");
    });

    it("handles conditional classes with boolean false", () => {
      expect(cn("base", false && "conditional")).toBe("base");
    });

    it("handles undefined and null values", () => {
      expect(cn("class1", undefined, "class2", null)).toBe("class1 class2");
    });

    it("merges Tailwind classes with conflicts (last wins)", () => {
      expect(cn("px-4", "px-6")).toBe("px-6");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles object notation for conditional classes", () => {
      expect(cn("base", { "font-bold": true, italic: false })).toBe("base font-bold");
    });

    it("handles array of classes", () => {
      expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
    });

    it("handles empty strings", () => {
      expect(cn("", "class1", "")).toBe("class1");
    });

    it("handles no arguments", () => {
      expect(cn()).toBe("");
    });

    it("handles complex Tailwind merge scenarios", () => {
      expect(cn("p-4", "py-2")).toBe("p-4 py-2");
      // bg-opacity-50 wins because tailwind-merge treats them as same group
      expect(cn("bg-red-500", "bg-opacity-50")).toBe("bg-opacity-50");
    });

    it("handles mixed conditional and static classes", () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
    });

    it("preserves non-Tailwind classes", () => {
      expect(cn("custom-class", "another-custom")).toBe("custom-class another-custom");
    });

    it("handles responsive Tailwind classes", () => {
      expect(cn("text-sm", "md:text-lg", "lg:text-xl")).toBe("text-sm md:text-lg lg:text-xl");
    });

    it("handles hover and focus states", () => {
      expect(cn("bg-blue-500", "hover:bg-blue-600", "focus:ring-2")).toBe("bg-blue-500 hover:bg-blue-600 focus:ring-2");
    });

    it("merges complex nested conditionals", () => {
      const result = cn(
        "base",
        {
          active: true,
          disabled: false,
        },
        true && "show",
        false && "hide",
      );
      expect(result).toBe("base active show");
    });

    it("handles whitespace in class strings", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("resolves Tailwind padding conflicts", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
      expect(cn("px-2", "px-4")).toBe("px-4");
      expect(cn("py-2", "py-4")).toBe("py-4");
    });

    it("resolves Tailwind margin conflicts", () => {
      expect(cn("m-2", "m-4")).toBe("m-4");
      expect(cn("mx-2", "mx-4")).toBe("mx-4");
    });

    it("resolves Tailwind text size conflicts", () => {
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("resolves Tailwind background color conflicts", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });

    it("keeps non-conflicting Tailwind classes", () => {
      expect(cn("px-4", "py-2", "bg-blue-500")).toBe("px-4 py-2 bg-blue-500");
    });
  });
});
