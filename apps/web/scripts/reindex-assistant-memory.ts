import { prisma } from "@rezumerai/database";
import { ConversationMemoryService } from "../src/elysia-api/modules/ai/memory/service";
import { AiService } from "../src/elysia-api/modules/ai/service";

function parseLimit(rawValue: string | undefined): number {
  const parsed = Number(rawValue ?? "100");

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 100;
  }

  return Math.floor(parsed);
}

async function main(): Promise<void> {
  const limit = parseLimit(
    process.argv[2] ?? process.env.AI_MEMORY_REINDEX_LIMIT,
  );

  await prisma.$connect();

  try {
    const config = await AiService.getAiConfiguration(prisma);
    const result = await ConversationMemoryService.reindexMissingEmbeddings(
      prisma,
      config,
      limit,
    );

    console.info(
      `[AI][RAG] reindex complete indexed=${result.indexedCount} limit=${limit}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(`[AI][RAG] reindex failed: ${message}`);
  process.exitCode = 1;
});
