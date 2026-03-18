import { beforeEach, describe, expect, it, mock } from "bun:test";

mock.module("@rezumerai/database", () => ({
  prisma: {
    $disconnect: mock(async () => {}),
  },
}));

mock.module("@/env", () => ({
  getServerEnv: mock(() => ({
    SHUTDOWN_TIMEOUT_MS: "30000",
    DATABASE_URL: "postgresql://localhost:5432/test",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ALLOWED_ORIGINS: "",
  })),
}));

mock.module("@/lib/logger", () => ({
  logger: {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {}),
  },
}));

mock.module("../jobs/queue", () => ({
  shutdownJobQueue: mock(async () => {}),
  getActiveJobsCount: mock(() => 0),
  drainJobQueue: mock(async () => true),
}));

const { gracefulShutdown, shutdownMiddleware, ShutdownManager } = await import("@/lib/graceful-shutdown");

interface MockContext {
  set: {
    status: number;
  };
}

describe("ShutdownManager", () => {
  beforeEach(() => {
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");
    gracefulShutdown.getState();
  });

  describe("initialization", () => {
    it("creates manager with default config", () => {
      const manager = new ShutdownManager();
      expect(manager.getIsShuttingDown()).toBe(false);
    });

    it("creates manager with custom timeout", () => {
      const manager = new ShutdownManager({ shutdownTimeoutMs: 60000 });
      const state = manager.getState();
      expect(state.isShuttingDown).toBe(false);
    });
  });

  describe("request tracking", () => {
    it("starts request successfully when not shutting down", () => {
      const manager = new ShutdownManager();
      const canStart = manager.startRequest();
      expect(canStart).toBe(true);
      expect(manager.getActiveRequests()).toBe(1);
    });

    it("rejects request when shutting down", () => {
      const manager = new ShutdownManager();
      manager.registerHandlers();

      (manager as unknown as { isShuttingDown: boolean }).isShuttingDown = true;

      const canStart = manager.startRequest();
      expect(canStart).toBe(false);
    });

    it("ends request and decrements count", () => {
      const manager = new ShutdownManager();
      manager.startRequest();
      manager.startRequest();
      expect(manager.getActiveRequests()).toBe(2);

      manager.endRequest();
      expect(manager.getActiveRequests()).toBe(1);

      manager.endRequest();
      expect(manager.getActiveRequests()).toBe(0);
    });

    it("does not go below zero when ending requests", () => {
      const manager = new ShutdownManager();
      manager.endRequest();
      expect(manager.getActiveRequests()).toBe(0);
    });
  });

  describe("shutdown state", () => {
    it("returns correct shutdown state", () => {
      const manager = new ShutdownManager();
      const state = manager.getState();

      expect(state.isShuttingDown).toBe(false);
      expect(state.activeRequests).toBe(0);
      expect(state.shutdownStartedAt).toBeNull();
    });
  });

  describe("middleware", () => {
    it("rejects request with 503 when shutting down", async () => {
      const ctx: MockContext = {
        set: {
          status: 200,
        },
      };

      const next = mock(async () => {});

      gracefulShutdown.getState();
      (gracefulShutdown as unknown as { isShuttingDown: boolean }).isShuttingDown = true;

      const middleware = shutdownMiddleware();
      await middleware(ctx as never, next);

      expect(ctx.set.status).toBe(503);
      expect(next).not.toHaveBeenCalled();
    });

    it("allows request when not shutting down", async () => {
      const ctx: MockContext = {
        set: {
          status: 200,
        },
      };

      const next = mock(async () => {});

      gracefulShutdown.getState();
      (gracefulShutdown as unknown as { isShuttingDown: boolean }).isShuttingDown = false;

      const middleware = shutdownMiddleware();
      await middleware(ctx as never, next);

      expect(next).toHaveBeenCalled();
    });

    it("tracks request through middleware lifecycle", async () => {
      const ctx: MockContext = {
        set: {
          status: 200,
        },
      };

      let requestCompleted = false;

      const next = mock(async () => {
        requestCompleted = true;
      });

      const middleware = shutdownMiddleware();
      await middleware(ctx as never, next);

      expect(next).toHaveBeenCalled();
      expect(requestCompleted).toBe(true);
    });
  });
});

describe("shutdownMiddleware response format", () => {
  it("returns proper 503 response structure", async () => {
    const ctx: MockContext = {
      set: {
        status: 200,
      },
    };

    gracefulShutdown.getState();
    (gracefulShutdown as unknown as { isShuttingDown: boolean }).isShuttingDown = true;

    const middleware = shutdownMiddleware();
    const result = await middleware(ctx as never, async () => {});

    expect(result).toEqual({
      error: "Service Unavailable",
      message: "Server is shutting down. Please try again later.",
      retryAfter: 30,
    });
  });
});
