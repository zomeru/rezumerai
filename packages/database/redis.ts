import Redis from "ioredis";

/**
 * Singleton ioredis client — initialized once at module load time.
 *
 * Lives in this compiled workspace package (external to Turbopack) so it is
 * never re-evaluated during hot-module replacement. Import this instance in
 * app-layer plugins instead of calling `new Redis()` directly, to guarantee
 * exactly one TCP connection per process.
 *
 * Import path: `@rezumerai/database/redis`
 *
 * @example
 * ```ts
 * import { redisConnection } from "@rezumerai/database/redis";
 * ```
 */
export const redisConnection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  lazyConnect: false,
});
