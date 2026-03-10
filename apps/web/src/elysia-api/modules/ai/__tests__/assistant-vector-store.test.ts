import { beforeEach, describe, expect, it, mock } from "bun:test";

const createIndexMock = mock(async () => undefined);
const poolQueryMock = mock(async () => ({ rows: [] as Array<Record<string, unknown>> }));

mock.module("@/env", () => ({
  serverEnv: {
    DATABASE_URL: "postgresql://rezumerai:rezumerai@localhost:5432/rezumerai",
  },
}));

mock.module("@mastra/pg", () => ({
  PgVector: class PgVector {
    pool = {
      query: poolQueryMock,
    };

    constructor(readonly config: Record<string, unknown>) {}

    async createIndex(params: Record<string, unknown>): Promise<void> {
      await createIndexMock(params);
    }
  },
  PostgresStore: class PostgresStore {
    constructor(readonly config: Record<string, unknown>) {}

    async init(): Promise<void> {}
  },
}));

async function importRuntimeModule() {
  return import(`../memory/runtime?vector-store-test=${Date.now()}-${Math.random()}`);
}

describe("assistant vector store", () => {
  beforeEach(() => {
    createIndexMock.mockClear();
    poolQueryMock.mockClear();
    globalThis.__rezumeraiAssistantVectorStore = undefined;
  });

  it("uses halfvec automatically for assistant memory indexes above 2000 dimensions", async () => {
    const runtimeModule = await importRuntimeModule();
    const store = runtimeModule.getAssistantVectorStore();

    await store.createIndex({
      indexName: "memory_messages_2048",
      dimension: 2048,
      indexConfig: {
        type: "hnsw",
      },
    });

    expect(createIndexMock).toHaveBeenCalledTimes(1);
    expect(createIndexMock.mock.calls[0]?.[0]).toMatchObject({
      indexName: "memory_messages_2048",
      dimension: 2048,
      vectorType: "halfvec",
    });
  });

  it("drops a stale vector-typed memory index table before recreating it as halfvec", async () => {
    const runtimeModule = await importRuntimeModule();
    poolQueryMock.mockImplementation(async (sql: string) => {
      if (sql.includes("information_schema.columns")) {
        return {
          rows: [
            {
              table_schema: "public",
              udt_name: "vector",
            },
          ],
        };
      }

      return { rows: [] };
    });

    const store = runtimeModule.getAssistantVectorStore();

    await store.createIndex({
      indexName: "memory_messages_2048",
      dimension: 2048,
      indexConfig: {
        type: "hnsw",
      },
    });

    expect(
      poolQueryMock.mock.calls.some(([sql]) =>
        String(sql).includes('DROP TABLE IF EXISTS "public"."memory_messages_2048" CASCADE'),
      ),
    ).toBe(true);
    expect(createIndexMock.mock.calls[0]?.[0]).toMatchObject({
      vectorType: "halfvec",
    });
  });
});
