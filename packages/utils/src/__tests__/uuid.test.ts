import { describe, expect, it } from "bun:test";
import { generateUuidKey } from "../uuid";

describe("generateUuidKey", () => {
  it("generates a UUID when no id is provided", () => {
    const result = generateUuidKey();

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("generates a valid UUID v4 format", () => {
    const result = generateUuidKey();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(result).toMatch(uuidV4Regex);
  });

  it("returns the provided id when id is given", () => {
    const existingId = "existing-id-123";
    const result = generateUuidKey(existingId);

    expect(result).toBe(existingId);
  });

  it("returns the provided id even if it's not a UUID format", () => {
    const customId = "custom-identifier";
    const result = generateUuidKey(customId);

    expect(result).toBe(customId);
  });

  it("generates different UUIDs on subsequent calls", () => {
    const uuid1 = generateUuidKey();
    const uuid2 = generateUuidKey();
    const uuid3 = generateUuidKey();

    expect(uuid1).not.toBe(uuid2);
    expect(uuid2).not.toBe(uuid3);
    expect(uuid1).not.toBe(uuid3);
  });

  it("handles empty string as id", () => {
    const result = generateUuidKey("");

    // Empty string is truthy for ??, so it returns the empty string
    expect(result).toBeDefined();
    expect(result).toBe("");
    expect(result.length).toBe(0);
  });

  it("handles numeric string ids", () => {
    const numericId = "12345";
    const result = generateUuidKey(numericId);

    expect(result).toBe(numericId);
  });

  it("handles ids with special characters", () => {
    const specialId = "id-with_special.chars@123";
    const result = generateUuidKey(specialId);

    expect(result).toBe(specialId);
  });

  it("handles very long id strings", () => {
    const longId = "a".repeat(1000);
    const result = generateUuidKey(longId);

    expect(result).toBe(longId);
    expect(result.length).toBe(1000);
  });

  it("handles undefined explicitly", () => {
    const result = generateUuidKey(undefined);

    expect(result).toBeDefined();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(result).toMatch(uuidV4Regex);
  });
});
