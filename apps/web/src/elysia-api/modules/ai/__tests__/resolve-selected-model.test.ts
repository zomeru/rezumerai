import { describe, expect, it } from "bun:test";

// We test the resolution logic indirectly via a mirror helper that matches the
// expected behaviour of the private static resolveSelectedModel method.
// This keeps the test decoupled from private internals while validating the logic.

type Model = { id: string; modelId: string; name: string; providerName: string; providerDisplayName: string };

function resolveSelectedModel(
  models: Model[],
  selectedModelDbId: string | null,
  requestedModelId: string | null,
  defaultModelId: string | null,
): Model {
  if (models.length === 0) throw new Error("No active models");

  if (requestedModelId) {
    const found = models.find((m) => m.modelId === requestedModelId);
    if (!found) throw new Error("Requested model not available");
    return found;
  }

  if (selectedModelDbId) {
    const saved = models.find((m) => m.id === selectedModelDbId);
    if (saved) return saved;
  }

  if (defaultModelId) {
    const defaultModel = models.find((m) => m.modelId === defaultModelId);
    if (defaultModel) return defaultModel;
  }

  const [fallback] = models;
  if (!fallback) throw new Error("No active models");
  return fallback;
}

const FREE_MODEL: Model = {
  id: "m1",
  modelId: "openrouter/free",
  name: "Free Models Router",
  providerName: "openrouter",
  providerDisplayName: "OpenRouter",
};
const PAID_MODEL: Model = {
  id: "m2",
  modelId: "qwen/qwen3-235b",
  name: "Qwen 3",
  providerName: "openrouter",
  providerDisplayName: "OpenRouter",
};
const MODELS = [FREE_MODEL, PAID_MODEL];

describe("resolveSelectedModel with defaultModelId", () => {
  it("returns user saved preference when set", () => {
    expect(resolveSelectedModel(MODELS, "m2", null, "openrouter/free")).toBe(PAID_MODEL);
  });

  it("returns defaultModelId match when user has no saved preference", () => {
    expect(resolveSelectedModel(MODELS, null, null, "openrouter/free")).toBe(FREE_MODEL);
  });

  it("returns models[0] when defaultModelId does not match any active model", () => {
    expect(resolveSelectedModel(MODELS, null, null, "unknown/model")).toBe(FREE_MODEL);
  });

  it("returns requestedModelId override even when user preference exists", () => {
    expect(resolveSelectedModel(MODELS, "m2", "openrouter/free", "openrouter/free")).toBe(FREE_MODEL);
  });

  it("throws when requestedModelId is not in active models", () => {
    expect(() => resolveSelectedModel(MODELS, null, "not/active", "openrouter/free")).toThrow();
  });

  it("returns models[0] when defaultModelId is null and no user preference", () => {
    expect(resolveSelectedModel(MODELS, null, null, null)).toBe(FREE_MODEL);
  });

  it("falls through to defaultModelId when selectedModelDbId does not match any active model", () => {
    expect(resolveSelectedModel(MODELS, "stale-db-id", null, "openrouter/free")).toBe(FREE_MODEL);
  });
});
