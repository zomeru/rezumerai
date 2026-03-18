import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { DEFAULT_AI_CIRCUIT_BREAKER_CONFIG } from "@rezumerai/types";
import {
  AiProviderCircuitBreakerError,
  getCircuitBreakerConfig,
  getCircuitBreakerStats,
  initializeCircuitBreaker,
  resetCircuitBreaker,
} from "../registry";

describe("Provider Registry with Circuit Breaker", () => {
  beforeEach(() => {
    resetCircuitBreaker();
  });

  afterEach(() => {
    resetCircuitBreaker();
  });

  describe("initializeCircuitBreaker", () => {
    it("initializes with valid database config", () => {
      const dbConfig = {
        ENABLED: true,
        FAILURE_THRESHOLD: 10,
        RESET_TIMEOUT_MS: 120000,
        EXECUTION_TIMEOUT_MS: 45000,
        HALF_OPEN_SUCCESS_THRESHOLD: 3,
      };

      initializeCircuitBreaker(dbConfig);
      const config = getCircuitBreakerConfig();

      expect(config.ENABLED).toBe(true);
      expect(config.FAILURE_THRESHOLD).toBe(10);
      expect(config.RESET_TIMEOUT_MS).toBe(120000);
      expect(config.EXECUTION_TIMEOUT_MS).toBe(45000);
      expect(config.HALF_OPEN_SUCCESS_THRESHOLD).toBe(3);
    });

    it("uses defaults when db config is null", () => {
      initializeCircuitBreaker(null);
      const config = getCircuitBreakerConfig();

      expect(config).toEqual(DEFAULT_AI_CIRCUIT_BREAKER_CONFIG);
    });

    it("uses defaults when db config is empty object", () => {
      initializeCircuitBreaker({});
      const config = getCircuitBreakerConfig();

      expect(config.ENABLED).toBe(true);
      expect(config.FAILURE_THRESHOLD).toBe(5);
    });

    it("clamps minimum values for safety", () => {
      const dbConfig = {
        ENABLED: true,
        FAILURE_THRESHOLD: 0, // Should be clamped to 1
        RESET_TIMEOUT_MS: 100, // Should be clamped to 1000
        EXECUTION_TIMEOUT_MS: 100, // Should be clamped to 1000
        HALF_OPEN_SUCCESS_THRESHOLD: 0, // Should be clamped to 1
      };

      initializeCircuitBreaker(dbConfig);
      const config = getCircuitBreakerConfig();

      expect(config.FAILURE_THRESHOLD).toBeGreaterThanOrEqual(1);
      expect(config.RESET_TIMEOUT_MS).toBeGreaterThanOrEqual(1000);
      expect(config.EXECUTION_TIMEOUT_MS).toBeGreaterThanOrEqual(1000);
      expect(config.HALF_OPEN_SUCCESS_THRESHOLD).toBeGreaterThanOrEqual(1);
    });

    it("supports legacy camelCase format for backwards compatibility", () => {
      const dbConfig = {
        enabled: false,
        failureThreshold: 8,
        resetTimeoutMs: 90000,
        executionTimeoutMs: 35000,
        halfOpenSuccessThreshold: 4,
      };

      initializeCircuitBreaker(dbConfig);
      const config = getCircuitBreakerConfig();

      expect(config.ENABLED).toBe(false);
      expect(config.FAILURE_THRESHOLD).toBe(8);
      expect(config.RESET_TIMEOUT_MS).toBe(90000);
      expect(config.EXECUTION_TIMEOUT_MS).toBe(35000);
      expect(config.HALF_OPEN_SUCCESS_THRESHOLD).toBe(4);
    });
  });

  describe("AiProviderCircuitBreakerError", () => {
    it("has correct error properties", () => {
      const error = new AiProviderCircuitBreakerError(5000);
      expect(error.name).toBe("AiProviderCircuitBreakerError");
      expect(error.code).toBe("AI_PROVIDER_CIRCUIT_BREAKER");
      expect(error.retryAfterMs).toBe(5000);
      expect(error.message).toContain("temporarily unavailable");
      expect(error.message).toContain("5 seconds");
    });
  });

  describe("circuit breaker stats", () => {
    it("provides statistics for monitoring", () => {
      resetCircuitBreaker();
      initializeCircuitBreaker(DEFAULT_AI_CIRCUIT_BREAKER_CONFIG);

      const stats = getCircuitBreakerStats();

      expect(stats).toBeDefined();
      expect(stats.state).toBe("CLOSED");
      expect(stats.failureCount).toBe(0);
      expect(stats.totalCalls).toBe(0);
    });
  });
});
