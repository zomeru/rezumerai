import { redisConnection } from "@rezumerai/database/redis";
import Elysia from "elysia";
import { bold, dim, paint, timestamp } from "../utils/ansi";

// ─── Logging Helper ───────────────────────────────────────────────────────────

const TAG = paint("cyan", bold("[Redis]"));
const log = (msg: string): void => console.log(`${timestamp()}  ${TAG}  ${msg}`);
const err = (msg: string, cause?: unknown): void =>
  console.error(`${timestamp()}  ${paint("red", bold("[Redis]"))}  ${paint("red", msg)}`, cause ?? "");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<"OK">;
  del(key: string): Promise<number>;
  ping(): Promise<string>;
  disconnect(): Promise<void>;
}

// ─── Handler tracking ─────────────────────────────────────────────────────────

/**
 * Symbol stored directly on the ioredis instance to track our registered event
 * handlers. Using `Symbol.for` makes it stable across module re-evaluations
 * (Turbopack HMR), so previous handlers can always be found and removed before
 * new ones are added — preventing listener stacking.
 */
const _HANDLERS = Symbol.for("rezumerai:redis:handlers");

interface RedisHandlers {
  ready: () => void;
  error: (e: Error) => void;
  close: () => void;
}

type InstrumentedRedis = typeof redisConnection & {
  [typeof _HANDLERS]?: RedisHandlers;
};

// ─── Client wrapper ───────────────────────────────────────────────────────────

const DEFAULT_TTL = 300;

/**
 * Wraps a pre-existing ioredis instance with the `RedisClient` interface.
 *
 * On Turbopack HMR re-evaluation, this module is re-executed but `redisConnection`
 * always refers to the same singleton object from `@rezumerai/database` (which lives
 * in Node.js's native module cache and is never re-evaluated). This function:
 *
 * - Removes previously registered event handlers (tracked via `_HANDLERS` Symbol)
 *   to prevent listener stacking across re-evaluations.
 * - Initialises `isConnected` from `redis.status` so cache operations work correctly
 *   without waiting for a `ready` event that will never re-fire on an existing connection.
 * - Opens no new TCP connection.
 */
function createRedisClient(redis: InstrumentedRedis): RedisClient {
  // Clean up handlers from the previous module evaluation (HMR safety)
  const prev = redis[_HANDLERS];
  if (prev) {
    redis.off("ready", prev.ready);
    redis.off("error", prev.error);
    redis.off("close", prev.close);
  }

  // Derive current connectivity state directly from ioredis' own status property
  let isConnected = redis.status === "ready";

  const handlers: RedisHandlers = {
    ready: () => {
      log(paint("green", "Connected"));
      isConnected = true;
    },
    error: (redisErr: Error) => {
      err("Error:", redisErr.message);
      isConnected = false;
    },
    close: () => {
      log(dim("Connection closed"));
      isConnected = false;
    },
  };

  redis.on("ready", handlers.ready);
  redis.on("error", handlers.error);
  redis.on("close", handlers.close);
  redis[_HANDLERS] = handlers;

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

    async set(key, value, ttlSeconds = DEFAULT_TTL) {
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

// ─── Client & Plugin ─────────────────────────────────────────────────────────

/**
 * Redis client — wraps the singleton ioredis connection from `@rezumerai/database`.
 *
 * The underlying TCP connection is owned by the compiled database package (external
 * to Turbopack) and is never re-created. On HMR re-evaluation this module re-runs
 * `createRedisClient`, which removes stale event handlers from the previous evaluation
 * and re-attaches fresh ones to the same connection — no new TCP socket is opened.
 */
export const redisClient: RedisClient = createRedisClient(redisConnection as InstrumentedRedis);

/**
 * Elysia Redis plugin — decorates the context with the shared `redis` client.
 *
 * Usage in modules:
 *   .get('/', ({ redis }) => redisCache(redis, 'key', fetchData))
 */
export const redisPlugin = new Elysia({ name: "plugin/redis" }).decorate("redis", redisClient).on("stop", async () => {
  await redisClient.disconnect();
  log(dim("Plugin stopped"));
});

export type { Redis } from "ioredis";
