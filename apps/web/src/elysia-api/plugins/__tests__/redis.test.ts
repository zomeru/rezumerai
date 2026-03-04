import { describe, expect, it, mock } from "bun:test";
import { type RedisClient, redisCache } from "../redis";

const TEST_KEY = "test:key";
const TEST_VALUE = JSON.stringify({ id: "1", name: "Test" });
const TEST_TTL = 60;

describe("redisCache", () => {
  it("returns cached data when cache hit", async () => {
    const mockRedis: RedisClient = {
      get: mock().mockResolvedValue(TEST_VALUE),
      set: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    const fetcher = mock().mockResolvedValue({ id: "1", name: "Test" });

    const result = await redisCache(mockRedis, TEST_KEY, fetcher, TEST_TTL);

    expect(result).toEqual({ id: "1", name: "Test" });
    expect(mockRedis.get).toHaveBeenCalledWith(TEST_KEY);
    expect(fetcher).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("fetches data and caches when cache miss", async () => {
    const mockRedis: RedisClient = {
      get: mock().mockResolvedValue(null),
      set: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    const fetchedData = { id: "1", name: "Test" };
    const fetcher = mock().mockResolvedValue(fetchedData);

    const result = await redisCache(mockRedis, TEST_KEY, fetcher, TEST_TTL);

    expect(result).toEqual(fetchedData);
    expect(mockRedis.get).toHaveBeenCalledWith(TEST_KEY);
    expect(fetcher).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith(TEST_KEY, JSON.stringify(fetchedData), TEST_TTL);
  });

  it("falls back to fetcher when Redis get fails", async () => {
    const mockRedis: RedisClient = {
      get: mock().mockRejectedValue(new Error("Redis error")),
      set: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    const fetchedData = { id: "1", name: "Test" };
    const fetcher = mock().mockResolvedValue(fetchedData);

    const result = await redisCache(mockRedis, TEST_KEY, fetcher, TEST_TTL);

    expect(result).toEqual(fetchedData);
    expect(fetcher).toHaveBeenCalled();
  });

  it("falls back to fetcher when Redis set fails", async () => {
    const mockRedis: RedisClient = {
      get: mock().mockResolvedValue(null),
      set: mock().mockRejectedValue(new Error("Redis error")),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    const fetchedData = { id: "1", name: "Test" };
    const fetcher = mock().mockResolvedValue(fetchedData);

    const result = await redisCache(mockRedis, TEST_KEY, fetcher, TEST_TTL);

    expect(result).toEqual(fetchedData);
    expect(fetcher).toHaveBeenCalled();
  });

  it("does not cache when fetcher returns null", async () => {
    const mockRedis: RedisClient = {
      get: mock().mockResolvedValue(null),
      set: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    const fetcher = mock().mockResolvedValue(null);

    const result = await redisCache(mockRedis, TEST_KEY, fetcher, TEST_TTL);

    expect(result).toBeNull();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("logs cache hit", async () => {
    const mockConsoleLog = mock(() => {});
    const originalConsoleLog = console.log;
    console.log = mockConsoleLog;

    const mockRedis: RedisClient = {
      get: mock().mockResolvedValue(TEST_VALUE),
      set: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    await redisCache(mockRedis, TEST_KEY, mock().mockResolvedValue({}), TEST_TTL);

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("HIT"));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(TEST_KEY));

    console.log = originalConsoleLog;
  });

  it("logs cache miss", async () => {
    const mockConsoleLog = mock(() => {});
    const originalConsoleLog = console.log;
    console.log = mockConsoleLog;

    const mockRedis: RedisClient = {
      get: mock().mockResolvedValue(null),
      set: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
      ping: mock().mockResolvedValue("PONG"),
      disconnect: mock().mockResolvedValue(undefined),
    };

    await redisCache(mockRedis, TEST_KEY, mock().mockResolvedValue({ id: "1" }), TEST_TTL);

    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining("MISS"));
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(TEST_KEY));

    console.log = originalConsoleLog;
  });
});
