import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { DEFAULT_AI_MODEL } from "@rezumerai/types";

// NOTE: The module under test does not exist yet (Task 7).
// These tests are expected to fail with "Cannot find module" until the service is implemented.
import {
  __resetCacheForTests,
  getAvailableModels,
  isValidFreeModel,
  resolveEffectiveModel,
} from "../openrouter-model-service";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

// Temporary local type — replace with the real import once Task 7 creates the service module.
interface OpenRouterModelOption {
  id: string;
  name: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  promptPricing: string;
  completionPricing: string;
}

// Fixtures only carry fields exercised by the tests (id lookup).
// Over-specifying fields creates maintenance friction when the service shape evolves.
const SAMPLE_MODELS = [
  { id: "openrouter/free" } as OpenRouterModelOption,
  { id: "qwen/qwen3-235b-a22b:free" } as OpenRouterModelOption,
];

// ---------------------------------------------------------------------------
// Helper: build a minimal OpenRouter /models API response body
// ---------------------------------------------------------------------------

function buildApiResponse(models: Array<{ id: string; name?: string; context_length?: number }>) {
  return JSON.stringify({
    data: models.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      context_length: m.context_length ?? 8192,
      architecture: {
        input_modalities: ["text"],
        output_modalities: ["text"],
        tokenizer: "other",
      },
      pricing: { prompt: "0", completion: "0" },
      supported_parameters: [],
    })),
  });
}

// ---------------------------------------------------------------------------
// Group 1: isValidFreeModel
// ---------------------------------------------------------------------------

describe("isValidFreeModel", () => {
  it("returns true when modelId is present in the models list", () => {
    expect(isValidFreeModel("qwen/qwen3-235b-a22b:free", SAMPLE_MODELS)).toBe(true);
  });

  it("returns false when modelId is not in the models list", () => {
    expect(isValidFreeModel("openai/gpt-4o", SAMPLE_MODELS)).toBe(false);
  });

  it("returns false for an empty models list", () => {
    expect(isValidFreeModel("openrouter/free", [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Group 2: resolveEffectiveModel
// ---------------------------------------------------------------------------

describe("resolveEffectiveModel", () => {
  it("returns the saved modelId when it is valid in the list", () => {
    expect(resolveEffectiveModel("qwen/qwen3-235b-a22b:free", SAMPLE_MODELS)).toBe("qwen/qwen3-235b-a22b:free");
  });

  it("returns DEFAULT_AI_MODEL when saved model is not in the list", () => {
    expect(resolveEffectiveModel("openai/gpt-4o", SAMPLE_MODELS)).toBe(DEFAULT_AI_MODEL);
  });

  it("returns DEFAULT_AI_MODEL when models list is empty", () => {
    expect(resolveEffectiveModel("qwen/qwen3-235b-a22b:free", [])).toBe(DEFAULT_AI_MODEL);
  });
});

// ---------------------------------------------------------------------------
// Group 3: getAvailableModels (tests filterFreeModels behaviour indirectly)
// ---------------------------------------------------------------------------

describe("getAvailableModels", () => {
  beforeEach(() => {
    // Restore any fetch mock and reset module-level cache so each test starts clean.
    // Without __resetCacheForTests(), stale cachedModels from a prior test would
    // bleed into subsequent tests and produce incorrect results.
    mock.restore();
    __resetCacheForTests();
  });

  it("always places openrouter/free first in results", async () => {
    spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        buildApiResponse([
          { id: "qwen/qwen3-235b-a22b:free" },
          { id: "openrouter/free" },
          { id: "meta-llama/llama-3.3-70b-instruct:free" },
        ]),
        { status: 200 },
      ),
    );

    const models = await getAvailableModels();
    expect(models[0]?.id).toBe("openrouter/free");
  });

  it("excludes models without ':free' in their id (and that are not openrouter/free)", async () => {
    spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        buildApiResponse([
          { id: "qwen/qwen3-235b-a22b:free" },
          { id: "openai/gpt-4o" }, // paid — should be excluded
          { id: "openrouter/free" },
        ]),
        { status: 200 },
      ),
    );

    const models = await getAvailableModels();
    const ids = models.map((m) => m.id);
    expect(ids).not.toContain("openai/gpt-4o");
    expect(ids).toContain("qwen/qwen3-235b-a22b:free");
  });

  it("excludes models with 'embed' in their id", async () => {
    spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        buildApiResponse([
          { id: "nvidia/embed-v1:free" }, // embed — should be excluded
          { id: "qwen/qwen3-235b-a22b:free" },
          { id: "openrouter/free" },
        ]),
        { status: 200 },
      ),
    );

    const models = await getAvailableModels();
    const ids = models.map((m) => m.id);
    expect(ids).not.toContain("nvidia/embed-v1:free");
  });

  it("always includes openrouter/free even when absent from API response", async () => {
    spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        buildApiResponse([
          { id: "qwen/qwen3-235b-a22b:free" },
          // openrouter/free intentionally omitted from API response
        ]),
        { status: 200 },
      ),
    );

    const models = await getAvailableModels();
    const ids = models.map((m) => m.id);
    expect(ids).toContain("openrouter/free");
  });

  it("deduplicates models — same id appears only once", async () => {
    spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        buildApiResponse([
          { id: "openrouter/free" },
          { id: "openrouter/free" }, // duplicate
          { id: "qwen/qwen3-235b-a22b:free" },
        ]),
        { status: 200 },
      ),
    );

    const models = await getAvailableModels();
    const freeRouterCount = models.filter((m) => m.id === "openrouter/free").length;
    expect(freeRouterCount).toBe(1);
  });

  it("returns fallback [{ id: 'openrouter/free', ... }] on fetch failure", async () => {
    spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const models = await getAvailableModels();
    expect(models).toHaveLength(1);
    expect(models[0]?.id).toBe("openrouter/free");
  });
});
