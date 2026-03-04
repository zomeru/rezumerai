import Elysia from "elysia";
import Redis from "ioredis";
import { bold, dim, paint, timestamp } from "../utils/ansi";

// ─── Logging Helper ───────────────────────────────────────────────────────────

const TAG = paint("cyan", bold("[Redis]"));
const log = (msg: string): void => console.log(`${timestamp()}  ${TAG}  ${msg}`);
const err = (msg: string, cause?: unknown): void =>
  console.error(`${timestamp()}  ${paint("red", bold("[Redis]"))}  ${paint("red", msg)}`, cause ?? "");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RedisPluginOptions {
  /**
   * Redis connection URL.
   * @default process.env.REDIS_URL ?? "redis://localhost:6379"
   */
  url?: string;

  /**
   * Default TTL in seconds for cached values.
   * @default 300
   */
  defaultTtl?: number;

  /**
   * Max reconnect attempts before giving up.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Elysia plugin scope (global, local, or scoped).
   * @default "global"
   */
  as?: "global" | "local" | "scoped";
}

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<"OK">;
  del(key: string): Promise<number>;
  ping(): Promise<string>;
  disconnect(): Promise<void>;
}

// ─── Fallback client ──────────────────────────────────────────────────────────

/** No-op client used when Redis is unavailable. All reads return null. */
function createFallbackClient(): RedisClient {
  return {
    async get() {
      return null;
    },
    async set() {
      return "OK" as "OK";
    },
    async del() {
      return 0;
    },
    async ping() {
      return "PONG";
    },
    async disconnect() {},
  };
}

// ─── Real client ──────────────────────────────────────────────────────────────

function createRedisClient(
  url: string,
  options: Required<Pick<RedisPluginOptions, "maxRetries" | "defaultTtl">>,
): RedisClient {
  let isConnected = false;

  const redis = new Redis(url, {
    maxRetriesPerRequest: options.maxRetries,
    retryStrategy(times) {
      if (times > options.maxRetries) {
        err(`Giving up after ${times} attempts`);
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on("ready", () => {
    log(`${paint("green", "Connected")} to ${dim(url)}`);
    isConnected = true;
  });

  redis.on("error", (redisErr) => {
    err("Error:", redisErr.message);
    isConnected = false;
  });

  redis.on("close", () => {
    log(dim("Connection closed"));
    isConnected = false;
  });

  return {
    async get(key) {
      if (!isConnected) return null;
      try {
        return await redis.get(key);
      } catch (getErr) {
        err("GET error:", getErr);
        return null;
      }
    },

    async set(key, value, ttlSeconds = options.defaultTtl) {
      if (!isConnected) return "OK" as "OK";
      try {
        return await redis.set(key, value, "EX", ttlSeconds);
      } catch (setErr) {
        err("SET error:", setErr);
        return "OK" as "OK";
      }
    },

    async del(key) {
      if (!isConnected) return 0;
      try {
        return await redis.del(key);
      } catch (delErr) {
        err("DEL error:", delErr);
        return 0;
      }
    },

    async ping() {
      try {
        const result = await redis.ping();
        isConnected = true;
        return result;
      } catch {
        isConnected = false;
        return "PONG";
      }
    },

    async disconnect() {
      await redis.quit();
      isConnected = false;
    },
  };
}

// ─── Cache helper ─────────────────────────────────────────────────────────────

/**
 * Cache-aside helper. Returns the cached value if present, otherwise
 * calls `fetcher`, stores the result, and returns it.
 *
 * Falls back to calling `fetcher` directly if Redis errors.
 *
 * @example
 * ```ts
 * const user = await redisCache(redis, `user:${id}`, () => db.findUser(id));
 * ```
 */
export async function redisCache<T>(
  redis: RedisClient,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      log(`${paint("green", "HIT")}  ${dim(key)}`);
      return JSON.parse(cached) as T;
    }

    log(`${paint("yellow", "MISS")} ${dim(key)}`);
    const data = await fetcher();
    if (data != null) {
      await redis.set(key, JSON.stringify(data), ttl);
    }
    return data;
  } catch (cacheErr) {
    err("Cache error, bypassing cache:", cacheErr);
    return fetcher();
  }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

/**
 * Elysia Redis plugin that decorates the context with a `redis` client.
 *
 * Connects eagerly on startup and disconnects cleanly on server stop.
 * Falls back to a no-op client if the connection fails, so the app
 * continues to function without Redis.
 *
 * @example
 * ```ts
 * const app = new Elysia()
 *   .use(redisPlugin())
 *   .get("/", ({ redis }) => redisCache(redis, "key", fetchData));
 * ```
 */
export const redisPlugin = (options?: RedisPluginOptions) => {
  const url = options?.url ?? process.env.REDIS_URL ?? "redis://localhost:6379";
  const defaultTtl = options?.defaultTtl ?? 300;
  const maxRetries = options?.maxRetries ?? 3;

  let client: RedisClient;

  try {
    client = createRedisClient(url, { defaultTtl, maxRetries });
    log(paint("green", "[Redis] Plugin initialized"));
  } catch (initErr) {
    err("[Redis] Failed to initialize, using fallback client:", initErr);
    client = createFallbackClient();
  }

  return new Elysia({ name: "plugin/redis" }).decorate("redis", client).on("stop", async () => {
    await client.disconnect();
    log(dim("[Redis] Plugin stopped"));
  });
};

export type { Redis } from "ioredis";
