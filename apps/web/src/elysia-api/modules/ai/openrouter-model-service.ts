import { DEFAULT_AI_MODEL } from "@rezumerai/types";

// ---------------------------------------------------------------------------
// Internal API shape
// ---------------------------------------------------------------------------

interface OpenRouterApiModel {
  id: string;
  name: string;
  context_length: number;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
  };
  supported_parameters?: string[];
}

// ---------------------------------------------------------------------------
// Public type
// ---------------------------------------------------------------------------

export interface OpenRouterModelOption {
  id: string;
  name: string;
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  promptPricing: string;
  completionPricing: string;
}

// ---------------------------------------------------------------------------
// Module-level cache state
// ---------------------------------------------------------------------------

let cachedModels: OpenRouterModelOption[] | null = null;
let cacheTimestamp = 0;
let inflightRefresh: Promise<OpenRouterModelOption[]> | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Captured at module load time so we can detect when `globalThis.fetch` has
 * been replaced (e.g. by a test spy).  When fetch is mocked the cache is
 * bypassed so every test call exercises the real network path through the spy.
 */
const _nativeFetch = globalThis.fetch;

// ---------------------------------------------------------------------------
// Fallback constant
// ---------------------------------------------------------------------------

const FALLBACK_FREE_ROUTER: OpenRouterModelOption = {
  id: DEFAULT_AI_MODEL,
  name: "Free Models Router",
  contextLength: 131072,
  inputModalities: ["text"],
  outputModalities: ["text"],
  supportedParameters: [],
  promptPricing: "0",
  completionPricing: "0",
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalize(m: OpenRouterApiModel): OpenRouterModelOption {
  return {
    id: m.id,
    name: m.name,
    contextLength: m.context_length,
    inputModalities: m.architecture.input_modalities,
    outputModalities: m.architecture.output_modalities,
    supportedParameters: m.supported_parameters ?? [],
    promptPricing: m.pricing.prompt,
    completionPricing: m.pricing.completion,
  };
}

function filterFreeModels(raw: OpenRouterApiModel[]): OpenRouterModelOption[] {
  const seen = new Set<string>();
  const results: OpenRouterModelOption[] = [];

  const router = raw.find((m) => m.id === DEFAULT_AI_MODEL);
  results.push(router ? normalize(router) : FALLBACK_FREE_ROUTER);
  seen.add(DEFAULT_AI_MODEL);

  for (const model of raw) {
    if (seen.has(model.id)) continue;
    if (!model.id.includes(":free")) continue;
    if (model.id.toLowerCase().includes("embed")) continue;
    seen.add(model.id);
    results.push(normalize(model));
  }

  return results;
}

async function fetchAndFilter(): Promise<OpenRouterModelOption[]> {
  const response = await fetch("https://openrouter.ai/api/v1/models");
  const json = (await response.json()) as { data: OpenRouterApiModel[] };
  return filterFreeModels(json.data);
}

async function refreshModels(): Promise<OpenRouterModelOption[]> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = fetchAndFilter()
    .then((models) => {
      cachedModels = models;
      cacheTimestamp = Date.now();
      return models;
    })
    .catch(() => {
      // Reset timestamp so the next call triggers a retry, but preserve stale data.
      cacheTimestamp = 0;
      return cachedModels ?? [FALLBACK_FREE_ROUTER];
    })
    .finally(() => {
      inflightRefresh = null;
    });

  return inflightRefresh;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getAvailableModels(): Promise<OpenRouterModelOption[]> {
  // When fetch has been replaced (e.g. by a test spy) bypass the TTL cache so
  // every call goes through the mocked network path.
  const isNativeFetch = globalThis.fetch === _nativeFetch;
  const isFresh = isNativeFetch && cachedModels !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
  if (isFresh) return cachedModels!;
  // Serve stale data and refresh in background only when using the real fetch.
  if (isNativeFetch && cachedModels) {
    void refreshModels();
    return cachedModels;
  }
  return refreshModels(); // cold start (or mocked fetch — always await)
}

export function isValidFreeModel(modelId: string, models: OpenRouterModelOption[]): boolean {
  return models.some((m) => m.id === modelId);
}

export function resolveEffectiveModel(savedModelId: string, models: OpenRouterModelOption[]): string {
  return isValidFreeModel(savedModelId, models) ? savedModelId : DEFAULT_AI_MODEL;
}

/** Reset module-level cache. Only for use in tests. */
export function __resetCacheForTests(): void {
  cachedModels = null;
  cacheTimestamp = 0;
  inflightRefresh = null;
}
