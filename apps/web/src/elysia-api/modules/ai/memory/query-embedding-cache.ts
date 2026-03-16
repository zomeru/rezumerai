/**
 * Query embedding cache for RAG (Retrieval Augmented Generation).
 *
 * Caches embeddings for recent user queries to avoid regenerating
 * embeddings for similar or repeated queries.
 *
 * Cache strategy:
 * - TTL-based expiration (5 minutes)
 * - LRU eviction when cache exceeds max size
 * - Exact match only (no fuzzy matching for simplicity)
 */

import type { AiConfiguration } from "@rezumerai/types";

interface CachedQueryEmbedding {
  /** The original query text */
  query: string;
  /** The generated embedding vector */
  embedding: number[];
  /** When this cache entry was created */
  createdAt: number;
  /** Access count for LRU eviction */
  accessCount: number;
}

interface QueryEmbeddingCacheOptions {
  /** Maximum number of entries in cache */
  maxEntries?: number;
  /** TTL in milliseconds (default: 5 minutes) */
  ttlMs?: number;
}

const DEFAULT_MAX_ENTRIES = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Simple LRU cache for query embeddings.
 */
export class QueryEmbeddingCache {
  private cache: Map<string, CachedQueryEmbedding>;
  private maxEntries: number;
  private ttlMs: number;
  private hitCount: number;
  private missCount: number;

  constructor(options: QueryEmbeddingCacheOptions = {}) {
    this.cache = new Map();
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Generate a cache key from query and config.
   * Includes embedding model to avoid cache collisions when model changes.
   */
  private generateCacheKey(query: string, config: AiConfiguration): string {
    return `${config.EMBEDDING_MODEL}:${config.EMBEDDING_DIMENSIONS}:${query.toLowerCase().trim()}`;
  }

  /**
   * Get embedding from cache.
   * Returns null if not found or expired.
   */
  get(query: string, config: AiConfiguration): number[] | null {
    const key = this.generateCacheKey(query, config);
    const cached = this.cache.get(key);

    if (!cached) {
      this.missCount++;
      return null;
    }

    // Check TTL
    if (Date.now() - cached.createdAt > this.ttlMs) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access count for LRU
    cached.accessCount++;
    this.hitCount++;

    return [...cached.embedding]; // Return copy to prevent mutation
  }

  /**
   * Store embedding in cache.
   */
  set(query: string, config: AiConfiguration, embedding: number[]): void {
    const key = this.generateCacheKey(query, config);

    // Evict if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      query,
      embedding,
      createdAt: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Evict the least recently used entry.
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruAccessCount = Infinity;

    for (const [key, value] of this.cache.entries()) {
      if (value.accessCount < lruAccessCount) {
        lruAccessCount = value.accessCount;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats(): {
    size: number;
    maxEntries: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
  } {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
    };
  }

  /**
   * Remove expired entries.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.createdAt > this.ttlMs) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Singleton cache instance.
 */
let instance: QueryEmbeddingCache | null = null;

/**
 * Get the global query embedding cache.
 */
export function getQueryEmbeddingCache(): QueryEmbeddingCache {
  if (!instance) {
    instance = new QueryEmbeddingCache();
  }
  return instance;
}

/**
 * Reset the global cache (for testing).
 */
export function resetQueryEmbeddingCache(): void {
  instance = null;
}
