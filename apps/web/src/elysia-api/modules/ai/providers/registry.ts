import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { AiCircuitBreakerConfig, AiConfiguration } from "@rezumerai/types";
import { DEFAULT_AI_CIRCUIT_BREAKER_CONFIG } from "@rezumerai/types";
import type { EmbeddingModel, LanguageModel } from "ai";
import { createLogger } from "@/lib/logger";
import {
  type CircuitBreaker,
  type CircuitBreakerConfig,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
  createCircuitBreaker,
} from "../lib/circuit-breaker";

const logger = createLogger({ module: "ai-provider" });

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

export class AiProviderCircuitBreakerError extends Error {
  readonly code = "AI_PROVIDER_CIRCUIT_BREAKER";
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super(`AI provider is temporarily unavailable. Please try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`);
    this.name = "AiProviderCircuitBreakerError";
    this.retryAfterMs = retryAfterMs;
  }
}

type OpenRouterLike = {
  chat: (modelId: string, settings?: unknown) => LanguageModel;
  textEmbeddingModel: (modelId: string, settings?: unknown) => EmbeddingModel;
};

interface CreateAiProviderRegistryOptions {
  apiKey?: string;
  appName?: string;
  siteUrl?: string;
  createOpenRouter?: (options: {
    apiKey: string;
    headers: Record<string, string>;
    compatibility: "strict";
  }) => OpenRouterLike;
}

/**
 * Global circuit breaker instance for AI provider calls.
 * Using a module-level singleton to share state across all provider calls.
 */
let _circuitBreaker: CircuitBreaker | null = null;
let _circuitBreakerConfig: AiCircuitBreakerConfig | null = null;

/**
 * Parse circuit breaker config from database value with safe defaults.
 * Handles both SCREAMING_SNAKE_CASE (canonical) and camelCase (legacy) formats.
 */
function parseCircuitBreakerConfig(value: unknown): AiCircuitBreakerConfig {
  if (!value || typeof value !== "object") {
    return DEFAULT_AI_CIRCUIT_BREAKER_CONFIG;
  }

  const raw = value as Record<string, unknown>;

  // Helper to get value with fallback for camelCase (legacy) format
  const getValue = (screamingKey: string, camelKey: string, defaultValue: unknown) => {
    if (screamingKey in raw) return raw[screamingKey];
    if (camelKey in raw) return raw[camelKey];
    return defaultValue;
  };

  const config: AiCircuitBreakerConfig = {
    ENABLED:
      typeof getValue("ENABLED", "enabled", DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.ENABLED) === "boolean"
        ? (getValue("ENABLED", "enabled", DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.ENABLED) as boolean)
        : DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.ENABLED,
    FAILURE_THRESHOLD:
      typeof getValue("FAILURE_THRESHOLD", "failureThreshold", DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD) ===
      "number"
        ? Math.max(
            1,
            Math.floor(
              getValue(
                "FAILURE_THRESHOLD",
                "failureThreshold",
                DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD,
              ) as number,
            ),
          )
        : DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.FAILURE_THRESHOLD,
    RESET_TIMEOUT_MS:
      typeof getValue("RESET_TIMEOUT_MS", "resetTimeoutMs", DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS) ===
      "number"
        ? Math.max(
            1000,
            Math.floor(
              getValue(
                "RESET_TIMEOUT_MS",
                "resetTimeoutMs",
                DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS,
              ) as number,
            ),
          )
        : DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.RESET_TIMEOUT_MS,
    EXECUTION_TIMEOUT_MS:
      typeof getValue(
        "EXECUTION_TIMEOUT_MS",
        "executionTimeoutMs",
        DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.EXECUTION_TIMEOUT_MS,
      ) === "number"
        ? Math.max(
            1000,
            Math.floor(
              getValue(
                "EXECUTION_TIMEOUT_MS",
                "executionTimeoutMs",
                DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.EXECUTION_TIMEOUT_MS,
              ) as number,
            ),
          )
        : DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.EXECUTION_TIMEOUT_MS,
    HALF_OPEN_SUCCESS_THRESHOLD:
      typeof getValue(
        "HALF_OPEN_SUCCESS_THRESHOLD",
        "halfOpenSuccessThreshold",
        DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.HALF_OPEN_SUCCESS_THRESHOLD,
      ) === "number"
        ? Math.max(
            1,
            Math.floor(
              getValue(
                "HALF_OPEN_SUCCESS_THRESHOLD",
                "halfOpenSuccessThreshold",
                DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.HALF_OPEN_SUCCESS_THRESHOLD,
              ) as number,
            ),
          )
        : DEFAULT_AI_CIRCUIT_BREAKER_CONFIG.HALF_OPEN_SUCCESS_THRESHOLD,
  };

  return config;
}

/**
 * Initialize or update the circuit breaker with database config.
 * Called at app startup and can be called when config changes.
 */
export function initializeCircuitBreaker(dbConfig: unknown): void {
  const config = parseCircuitBreakerConfig(dbConfig);
  _circuitBreakerConfig = config;

  if (!config.ENABLED) {
    logger.warn("AI circuit breaker is disabled via database configuration");
    return;
  }

  const breakerConfig: CircuitBreakerConfig = {
    failureThreshold: config.FAILURE_THRESHOLD,
    resetTimeoutMs: config.RESET_TIMEOUT_MS,
    executionTimeoutMs: config.EXECUTION_TIMEOUT_MS,
    halfOpenSuccessThreshold: config.HALF_OPEN_SUCCESS_THRESHOLD,
  };

  _circuitBreaker = createCircuitBreaker(breakerConfig, "openrouter", "provider-call");

  logger.info(
    {
      failureThreshold: config.FAILURE_THRESHOLD,
      resetTimeoutMs: config.RESET_TIMEOUT_MS,
      executionTimeoutMs: config.EXECUTION_TIMEOUT_MS,
      halfOpenSuccessThreshold: config.HALF_OPEN_SUCCESS_THRESHOLD,
      enabled: config.ENABLED,
    },
    "AI circuit breaker initialized from database config",
  );
}

/**
 * Get or create circuit breaker with lazy initialization.
 * Falls back to default config if not initialized.
 */
function getCircuitBreaker(): CircuitBreaker {
  if (!_circuitBreaker) {
    // Lazy initialization with default config if DB config not loaded yet
    logger.warn("Circuit breaker not initialized from DB, using defaults");
    initializeCircuitBreaker(DEFAULT_AI_CIRCUIT_BREAKER_CONFIG);
  }

  // biome-ignore lint/style/noNonNullAssertion: We ensure it's initialized above, so this is safe.
  return _circuitBreaker!;
}

/**
 * Reset the global circuit breaker (useful for testing or config reload).
 */
export function resetCircuitBreaker(): void {
  _circuitBreaker = null;
  _circuitBreakerConfig = null;
}

/**
 * Get circuit breaker statistics (useful for health checks/admin).
 */
export function getCircuitBreakerStats() {
  return getCircuitBreaker().getStats();
}

/**
 * Get current circuit breaker configuration.
 */
export function getCircuitBreakerConfig(): AiCircuitBreakerConfig {
  return _circuitBreakerConfig ?? DEFAULT_AI_CIRCUIT_BREAKER_CONFIG;
}

/**
 * Execute a language model operation with circuit breaker protection.
 * This wraps the doGenerate call with circuit breaker logic.
 */
export async function executeWithCircuitBreaker<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
  const circuitBreaker = getCircuitBreaker();
  const config = getCircuitBreakerConfig();

  if (!config.ENABLED) {
    // Skip circuit breaker if disabled
    return fn();
  }

  try {
    return await circuitBreaker.execute(fn);
  } catch (error) {
    if (error instanceof CircuitBreakerOpenError) {
      logger.warn(
        {
          operation: operationName,
          retryAfterMs: error.retryAfterMs,
        },
        "Circuit breaker open - AI provider unavailable",
      );
      throw new AiProviderCircuitBreakerError(error.retryAfterMs);
    }

    if (error instanceof CircuitBreakerTimeoutError) {
      logger.warn(
        {
          operation: operationName,
        },
        "Circuit breaker timeout - AI provider slow response",
      );
    }

    throw error;
  }
}

export function createAiProviderRegistry(options: CreateAiProviderRegistryOptions = {}) {
  const apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";

  if (!apiKey.trim()) {
    throw new ProviderConfigurationError("OpenRouter API key is required for the AI runtime.");
  }

  const provider = (options.createOpenRouter ?? createOpenRouter)({
    apiKey,
    compatibility: "strict",
    headers: {
      "HTTP-Referer": options.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": options.appName ?? "Rezumerai",
    },
  });

  return {
    getChatModel(modelId: string) {
      return provider.chat(modelId);
    },
    getEmbeddingModel(config: Pick<AiConfiguration, "EMBEDDING_MODEL">) {
      return provider.textEmbeddingModel(config.EMBEDDING_MODEL);
    },
  };
}

export function ensureEmbeddingDimension(options: { configuredDimension: number; embeddings: number[][] }): number {
  const dimension = options.embeddings[0]?.length ?? 0;

  if (dimension !== options.configuredDimension) {
    throw new ProviderConfigurationError(
      `Embedding dimension mismatch. Expected ${options.configuredDimension}, received ${dimension}.`,
    );
  }

  return options.configuredDimension;
}
