import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  CircuitBreaker,
  type CircuitBreakerConfig,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
  createCircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from "../circuit-breaker";

describe("CircuitBreaker", () => {
  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeoutMs: 100,
    executionTimeoutMs: 500,
    halfOpenSuccessThreshold: 2,
  };

  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(defaultConfig, "test-provider", "test-operation");
  });

  describe("initial state", () => {
    it("should start in CLOSED state", () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe("CLOSED");
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
    });

    it("should have zero totals on initialization", () => {
      const stats = circuitBreaker.getStats();
      expect(stats.totalCalls).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
    });
  });

  describe("CLOSED state behavior", () => {
    it("should allow successful calls to pass through", async () => {
      const result = await circuitBreaker.execute(async () => "success");
      expect(result).toBe("success");

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe("CLOSED");
      expect(stats.totalSuccesses).toBe(1);
    });

    it("should track failures but stay closed until threshold", async () => {
      const failingFn = async () => {
        throw new Error("Test error");
      };

      // First failure - should stay closed
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow("Test error");
      expect(circuitBreaker.getStats().state).toBe("CLOSED");
      expect(circuitBreaker.getStats().failureCount).toBe(1);

      // Second failure - should stay closed
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow("Test error");
      expect(circuitBreaker.getStats().state).toBe("CLOSED");
      expect(circuitBreaker.getStats().failureCount).toBe(2);

      // Third failure - should open
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow("Test error");
      expect(circuitBreaker.getStats().state).toBe("OPEN");
      expect(circuitBreaker.getStats().failureCount).toBe(3);
    });

    it("should reset failure count on success after some failures", async () => {
      const failingFn = async () => {
        throw new Error("Test error");
      };

      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow("Test error");
      expect(circuitBreaker.getStats().failureCount).toBe(1);

      await circuitBreaker.execute(async () => "success");
      expect(circuitBreaker.getStats().failureCount).toBe(0);
      expect(circuitBreaker.getStats().state).toBe("CLOSED");
    });
  });

  describe("OPEN state behavior", () => {
    it("should short-circuit calls when open", async () => {
      // Open the circuit
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await circuitBreaker
          .execute(async () => {
            throw new Error("Test error");
          })
          .catch(() => {});
      }

      expect(circuitBreaker.getStats().state).toBe("OPEN");

      // Should short-circuit without calling the function
      const fn = mock(async () => "should not be called");
      await expect(circuitBreaker.execute(fn)).rejects.toThrow(CircuitBreakerOpenError);
      expect(fn).not.toHaveBeenCalled();
    });

    it("should include retryAfterMs in CircuitBreakerOpenError", async () => {
      // Open the circuit
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await circuitBreaker
          .execute(async () => {
            throw new Error("Test error");
          })
          .catch(() => {});
      }

      try {
        await circuitBreaker.execute(async () => "test");
        throw new Error("Should have thrown CircuitBreakerOpenError");
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        expect((error as CircuitBreakerOpenError).retryAfterMs).toBeGreaterThan(0);
        expect((error as CircuitBreakerOpenError).retryAfterMs).toBeLessThanOrEqual(defaultConfig.resetTimeoutMs);
      }
    });

    it("should transition to HALF_OPEN after reset timeout", async () => {
      // Open the circuit
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await circuitBreaker
          .execute(async () => {
            throw new Error("Test error");
          })
          .catch(() => {});
      }

      expect(circuitBreaker.getStats().state).toBe("OPEN");

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, defaultConfig.resetTimeoutMs + 10));

      // Next call should transition to HALF_OPEN and execute the function
      const result = await circuitBreaker.execute(async () => "recovered");
      expect(result).toBe("recovered");
      expect(circuitBreaker.getStats().state).toBe("HALF_OPEN");
    });
  });

  describe("HALF_OPEN state behavior", () => {
    it("should close circuit after successful calls meet threshold", async () => {
      // Open the circuit
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await circuitBreaker
          .execute(async () => {
            throw new Error("Test error");
          })
          .catch(() => {});
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, defaultConfig.resetTimeoutMs + 10));

      // First successful call in half-open
      await circuitBreaker.execute(async () => "success1");
      expect(circuitBreaker.getStats().state).toBe("HALF_OPEN");
      expect(circuitBreaker.getStats().successCount).toBe(1);

      // Second successful call should close the circuit
      await circuitBreaker.execute(async () => "success2");
      expect(circuitBreaker.getStats().state).toBe("CLOSED");
      expect(circuitBreaker.getStats().successCount).toBe(0); // Reset on close
    });

    it("should reopen circuit on any failure in half-open state", async () => {
      // Open the circuit
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await circuitBreaker
          .execute(async () => {
            throw new Error("Test error");
          })
          .catch(() => {});
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, defaultConfig.resetTimeoutMs + 10));

      // First call succeeds
      await circuitBreaker.execute(async () => "success");
      expect(circuitBreaker.getStats().state).toBe("HALF_OPEN");

      // Second call fails - should reopen
      await circuitBreaker
        .execute(async () => {
          throw new Error("Test error");
        })
        .catch(() => {});

      expect(circuitBreaker.getStats().state).toBe("OPEN");
    });
  });

  describe("execution timeout", () => {
    it("should timeout slow calls", async () => {
      const slowConfig: CircuitBreakerConfig = {
        ...defaultConfig,
        executionTimeoutMs: 50,
      };
      const slowCircuitBreaker = new CircuitBreaker(slowConfig, "test", "test");

      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return "too slow";
      };

      await expect(slowCircuitBreaker.execute(slowFn)).rejects.toThrow(CircuitBreakerTimeoutError);
    });

    it("should not count timeout as failure for circuit state", async () => {
      const slowConfig: CircuitBreakerConfig = {
        ...defaultConfig,
        executionTimeoutMs: 50,
      };
      const slowCircuitBreaker = new CircuitBreaker(slowConfig, "test", "test");

      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return "too slow";
      };

      // Timeout should not increment failure count
      await slowCircuitBreaker.execute(slowFn).catch(() => {});
      expect(slowCircuitBreaker.getStats().failureCount).toBe(0);
      expect(slowCircuitBreaker.getStats().state).toBe("CLOSED");
    });

    it("should allow fast calls after timeout", async () => {
      const slowConfig: CircuitBreakerConfig = {
        ...defaultConfig,
        executionTimeoutMs: 50,
      };
      const slowCircuitBreaker = new CircuitBreaker(slowConfig, "test", "test");

      const slowFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return "too slow";
      };

      await expect(slowCircuitBreaker.execute(slowFn)).rejects.toThrow(CircuitBreakerTimeoutError);

      const fastFn = async () => "fast";
      const result = await slowCircuitBreaker.execute(fastFn);
      expect(result).toBe("fast");
    });
  });

  describe("manual control", () => {
    it("should manually open circuit", () => {
      circuitBreaker.open();
      expect(circuitBreaker.getStats().state).toBe("OPEN");
    });

    it("should manually close circuit and reset failures", () => {
      circuitBreaker.close();
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe("CLOSED");
      expect(stats.failureCount).toBe(0);
    });

    it("should reset circuit to initial state", () => {
      circuitBreaker.reset();
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe("CLOSED");
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.lastFailureTime).toBeNull();
    });
  });

  describe("concurrent safety", () => {
    it("should handle concurrent calls safely", async () => {
      const results = await Promise.allSettled([
        circuitBreaker.execute(async () => "result1"),
        circuitBreaker.execute(async () => "result2"),
        circuitBreaker.execute(async () => "result3"),
      ]);

      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      expect(circuitBreaker.getStats().totalCalls).toBe(3);
      expect(circuitBreaker.getStats().totalSuccesses).toBe(3);
    });

    it("should handle concurrent failures safely", async () => {
      const failingFn = async () => {
        throw new Error("Test error");
      };

      await Promise.allSettled([
        circuitBreaker.execute(failingFn),
        circuitBreaker.execute(failingFn),
        circuitBreaker.execute(failingFn),
      ]);

      const stats = circuitBreaker.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.totalFailures).toBe(3);
      expect(stats.state).toBe("OPEN"); // Should open after 3 failures
    });
  });

  describe("createCircuitBreaker factory", () => {
    it("should create circuit breaker with default config", () => {
      const cb = createCircuitBreaker();
      const stats = cb.getStats();
      expect(stats.state).toBe("CLOSED");
    });

    it("should merge partial config with defaults", () => {
      const cb = createCircuitBreaker({ failureThreshold: 10 });
      const stats = cb.getStats();
      expect(stats.state).toBe("CLOSED");
    });

    it("should accept custom provider and operation names", () => {
      const cb = createCircuitBreaker({}, "custom-provider", "custom-operation");
      // The names are used in logging, so we just verify it creates successfully
      expect(cb).toBeInstanceOf(CircuitBreaker);
    });
  });

  describe("DEFAULT_CIRCUIT_BREAKER_CONFIG", () => {
    it("should have sensible production defaults", () => {
      expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.failureThreshold).toBe(5);
      expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.resetTimeoutMs).toBe(60000);
      expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.executionTimeoutMs).toBe(30000);
      expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.halfOpenSuccessThreshold).toBe(2);
    });
  });
});

describe("CircuitBreakerOpenError", () => {
  it("should have correct error properties", () => {
    const error = new CircuitBreakerOpenError(5000);
    expect(error.name).toBe("CircuitBreakerOpenError");
    expect(error.code).toBe("CIRCUIT_BREAKER_OPEN");
    expect(error.retryAfterMs).toBe(5000);
    expect(error.message).toContain("temporarily unavailable");
  });
});

describe("CircuitBreakerTimeoutError", () => {
  it("should have correct error properties", () => {
    const error = new CircuitBreakerTimeoutError("test-operation", 1000);
    expect(error.name).toBe("CircuitBreakerTimeoutError");
    expect(error.code).toBe("CIRCUIT_BREAKER_TIMEOUT");
    expect(error.message).toContain("timed out after 1000ms");
  });
});
