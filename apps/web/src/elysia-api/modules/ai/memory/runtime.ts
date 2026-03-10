import { Memory } from "@mastra/memory";
import { PgVector, PostgresStore } from "@mastra/pg";
import type { AiConfiguration } from "@rezumerai/types";
import { serverEnv } from "@/env";
import { buildAssistantMemoryConfig } from "./config";
import { createAssistantEmbeddingModel, resolveAssistantVectorType } from "./embedder";

declare global {
  var __rezumeraiAssistantMemoryCache: Map<string, Memory> | undefined;
  var __rezumeraiAssistantPostgresStore: PostgresStore | undefined;
  var __rezumeraiAssistantVectorStore: PgVector | undefined;
  var __rezumeraiAssistantStorageInit: Promise<void> | undefined;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function buildAssistantMemoryCacheKey(
  config: AiConfiguration,
  memoryOptions: ReturnType<typeof buildAssistantMemoryConfig>,
): string {
  const semanticRecall =
    memoryOptions.semanticRecall && typeof memoryOptions.semanticRecall === "object"
      ? {
          topK: memoryOptions.semanticRecall.topK ?? null,
          scope: memoryOptions.semanticRecall.scope ?? null,
          messageRange: memoryOptions.semanticRecall.messageRange ?? null,
          indexConfig: memoryOptions.semanticRecall.indexConfig ?? null,
        }
      : (memoryOptions.semanticRecall ?? false);
  const workingMemory =
    memoryOptions.workingMemory && typeof memoryOptions.workingMemory === "object"
      ? {
          enabled: memoryOptions.workingMemory.enabled ?? false,
          scope: memoryOptions.workingMemory.scope ?? null,
        }
      : (memoryOptions.workingMemory ?? false);
  const observationalMemory =
    memoryOptions.observationalMemory && typeof memoryOptions.observationalMemory === "object"
      ? {
          model: memoryOptions.observationalMemory.model ?? null,
          scope: memoryOptions.observationalMemory.scope ?? null,
          observation: memoryOptions.observationalMemory.observation ?? null,
          reflection: memoryOptions.observationalMemory.reflection ?? null,
        }
      : (memoryOptions.observationalMemory ?? false);

  return JSON.stringify({
    version: 3,
    embedding: {
      provider: config.EMBEDDING_PROVIDER,
      model: config.EMBEDDING_MODEL,
      dimension: config.EMBEDDING_DIMENSIONS,
    },
    lastMessages: memoryOptions.lastMessages ?? null,
    semanticRecall,
    workingMemory,
    observationalMemory,
  });
}

class AssistantPgVector extends PgVector {
  override async createIndex(params: Parameters<PgVector["createIndex"]>[0]): Promise<void> {
    const vectorType = params.vectorType ?? resolveAssistantVectorType(params.dimension);

    await this.recreateStaleVectorTableIfNeeded(params.indexName, vectorType);
    await super.createIndex({
      ...params,
      vectorType,
    });
  }

  private async recreateStaleVectorTableIfNeeded(
    indexName: string,
    desiredVectorType: "halfvec" | "vector",
  ): Promise<void> {
    const pool = this.pool;

    if (!pool || typeof pool.query !== "function") {
      return;
    }

    const result = await pool.query<{
      table_schema: string;
      udt_name: string;
    }>(
      `SELECT table_schema, udt_name
       FROM information_schema.columns
       WHERE table_name = $1
         AND column_name = 'embedding'
       ORDER BY CASE
         WHEN table_schema = current_schema() THEN 0
         WHEN table_schema = 'public' THEN 1
         ELSE 2
       END
       LIMIT 1`,
      [indexName],
    );
    const existingColumn = result.rows[0];

    if (!existingColumn || existingColumn.udt_name === desiredVectorType) {
      return;
    }

    await pool.query(
      `DROP TABLE IF EXISTS ${quoteIdentifier(existingColumn.table_schema)}.${quoteIdentifier(indexName)} CASCADE`,
    );
  }
}

function getConnectionString(): string {
  if (!serverEnv?.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for assistant memory.");
  }

  return serverEnv.DATABASE_URL;
}

export function getAssistantPostgresStore(): PostgresStore {
  if (!globalThis.__rezumeraiAssistantPostgresStore) {
    globalThis.__rezumeraiAssistantPostgresStore = new PostgresStore({
      id: "rezumerai-assistant-storage",
      connectionString: getConnectionString(),
    });
  }

  return globalThis.__rezumeraiAssistantPostgresStore;
}

export function getAssistantVectorStore(): PgVector {
  if (!(globalThis.__rezumeraiAssistantVectorStore instanceof AssistantPgVector)) {
    globalThis.__rezumeraiAssistantVectorStore = new AssistantPgVector({
      id: "rezumerai-assistant-vector",
      connectionString: getConnectionString(),
    });
  }

  return globalThis.__rezumeraiAssistantVectorStore;
}

export async function ensureAssistantStorageReady(): Promise<void> {
  globalThis.__rezumeraiAssistantStorageInit ??= getAssistantPostgresStore().init();
  await globalThis.__rezumeraiAssistantStorageInit;
}

export function getAssistantMemory(config: AiConfiguration): Memory {
  globalThis.__rezumeraiAssistantMemoryCache ??= new Map<string, Memory>();

  const memoryOptions = buildAssistantMemoryConfig(config);
  const cacheKey = buildAssistantMemoryCacheKey(config, memoryOptions);
  const cached = globalThis.__rezumeraiAssistantMemoryCache.get(cacheKey);

  const semanticRecallEnabled = Boolean(memoryOptions.semanticRecall);
  const hasSemanticRecallDependencies = Boolean(cached?.vector && cached?.embedder);

  if (cached && (!semanticRecallEnabled || hasSemanticRecallDependencies)) {
    return cached;
  }

  const memory = new Memory({
    options: memoryOptions,
    storage: getAssistantPostgresStore(),
    vector: getAssistantVectorStore(),
    embedder: createAssistantEmbeddingModel(config),
  });

  globalThis.__rezumeraiAssistantMemoryCache.set(cacheKey, memory);
  return memory;
}
