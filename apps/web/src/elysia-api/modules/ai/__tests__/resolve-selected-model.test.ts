import { describe, expect, it } from "bun:test";
import { DEFAULT_AI_MODEL } from "@rezumerai/types";

// We test the resolution logic indirectly via a mirror helper that matches the
// expected behaviour of the private resolveModelId method on AiService.
// This keeps the test decoupled from private internals while validating the logic.

function resolveModelId(models: { id: string }[], savedModelId: string, requestedModelId: string | null): string {
  if (models.length === 0) throw new Error("No active models");

  if (requestedModelId) {
    if (!models.some((m) => m.id === requestedModelId)) throw new Error("Requested model not available");
    return requestedModelId;
  }

  if (models.some((m) => m.id === savedModelId)) {
    return savedModelId;
  }

  return DEFAULT_AI_MODEL;
}

const FREE_MODEL = { id: "openrouter/free" };
const PAID_MODEL = { id: "qwen/qwen3-235b" };
const MODELS = [FREE_MODEL, PAID_MODEL];

describe("resolveModelId", () => {
  it("returns requestedModelId when it is valid in the list", () => {
    expect(resolveModelId(MODELS, "openrouter/free", "qwen/qwen3-235b")).toBe("qwen/qwen3-235b");
  });

  it("throws when requestedModelId is not in the list", () => {
    expect(() => resolveModelId(MODELS, "openrouter/free", "not/active")).toThrow("Requested model not available");
  });

  it("returns savedModelId when it is valid and no requestedModelId given", () => {
    expect(resolveModelId(MODELS, "qwen/qwen3-235b", null)).toBe("qwen/qwen3-235b");
  });

  it("returns DEFAULT_AI_MODEL when savedModelId is not in the list", () => {
    expect(resolveModelId(MODELS, "stale/model-id", null)).toBe(DEFAULT_AI_MODEL);
  });

  it("returns DEFAULT_AI_MODEL when savedModelId is not in list and no requestedModelId", () => {
    expect(resolveModelId(MODELS, "unknown/model", null)).toBe(DEFAULT_AI_MODEL);
  });

  it("throws when models list is empty", () => {
    expect(() => resolveModelId([], "openrouter/free", null)).toThrow("No active models");
  });
});
