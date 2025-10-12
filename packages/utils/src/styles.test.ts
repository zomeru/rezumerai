import { describe, expect, it } from "vitest";
import { cn } from "./styles";

describe("Utils", () => {
  it("cn function works correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("cn handles conditional classes", () => {
    expect(cn("base", true && "conditional")).toBe("base conditional");
    expect(cn("base", false && "conditional")).toBe("base");
  });
});
