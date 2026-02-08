import { describe, expect, it } from "vitest";

describe("API Utils", () => {
  it("basic math works", () => {
    expect(1 + 1).toBe(2);
  });

  it("environment is test", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
