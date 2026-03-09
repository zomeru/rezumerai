import { Prisma, type PrismaClient } from "@rezumerai/database";
import type { AssistantRoleScope } from "@rezumerai/types";
import type { ConversationMemoryChunk } from "./chunking";
import type { SemanticConversationMatch } from "./retrieval";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

export interface ConversationEmbeddingRecord {
  id: string;
  conversationId: string;
  userId: string | null;
  scope: AssistantRoleScope;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface SimilarConversationQueryRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  score: number;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Conversation memory persistence is intentionally grouped behind stateless helpers.
export abstract class ConversationMemoryRepository {
  static async listMessagesMissingEmbeddings(db: DatabaseClient, limit: number): Promise<ConversationEmbeddingRecord[]> {
    return db.$queryRaw<ConversationEmbeddingRecord[]>(Prisma.sql`
      SELECT
        message."id" AS "id",
        message."conversationId" AS "conversationId",
        conversation."userId" AS "userId",
        conversation."scope"::text AS "scope",
        message."role"::text AS "role",
        message."content" AS "content",
        message."createdAt" AS "createdAt"
      FROM "ai_assistant_conversation_message" AS message
      INNER JOIN "ai_assistant_conversation" AS conversation
        ON conversation."id" = message."conversationId"
      LEFT JOIN "ai_assistant_conversation_embedding" AS embedding
        ON embedding."messageId" = message."id"
      WHERE embedding."id" IS NULL
      ORDER BY message."createdAt" ASC
      LIMIT ${limit}
    `);
  }

  static async querySimilarConversationMessages(
    db: DatabaseClient,
    options: {
      conversationId: string;
      scope: AssistantRoleScope;
      userId: string | null;
      queryEmbedding: number[];
      topK: number;
      excludeMessageIds?: string[];
    },
  ): Promise<SemanticConversationMatch[]> {
    const vectorLiteral = ConversationMemoryRepository.toVectorLiteral(options.queryEmbedding);
    const excludedIds =
      options.excludeMessageIds && options.excludeMessageIds.length > 0
        ? Prisma.sql`AND embedding."messageId" NOT IN (${Prisma.join(options.excludeMessageIds)})`
        : Prisma.empty;
    const userFilter =
      options.userId === null
        ? Prisma.sql`AND embedding."userId" IS NULL`
        : Prisma.sql`AND embedding."userId" = ${options.userId}`;

    const rows = await db.$queryRaw<SimilarConversationQueryRow[]>(Prisma.sql`
      SELECT
        embedding."messageId" AS "id",
        embedding."role"::text AS "role",
        embedding."content" AS "content",
        message."createdAt" AS "createdAt",
        1 - (embedding."embedding" <=> ${vectorLiteral}::vector) AS "score"
      FROM "ai_assistant_conversation_embedding" AS embedding
      INNER JOIN "ai_assistant_conversation_message" AS message
        ON message."id" = embedding."messageId"
      WHERE embedding."conversationId" = ${options.conversationId}
        AND embedding."scope" = ${options.scope}::"ai_assistant_conversation_scope"
        ${userFilter}
        ${excludedIds}
      ORDER BY embedding."embedding" <=> ${vectorLiteral}::vector ASC
      LIMIT ${options.topK}
    `);

    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: new Date(row.createdAt),
      score: Number(row.score),
    }));
  }

  static async upsertEmbeddings(
    db: DatabaseClient,
    options: {
      chunks: ConversationMemoryChunk[];
      embeddings: number[][];
    },
  ): Promise<void> {
    if (options.chunks.length === 0) {
      return;
    }

    const values = options.chunks.map((chunk, index) => {
      const embedding = options.embeddings[index];

      if (!embedding) {
        throw new Error(`Missing embedding vector for conversation message ${chunk.messageId}.`);
      }

      return Prisma.sql`(
        ${chunk.id},
        ${chunk.conversationId},
        ${chunk.messageId},
        ${chunk.userId},
        ${chunk.scope}::"ai_assistant_conversation_scope",
        ${chunk.role}::"ai_assistant_conversation_role",
        ${chunk.content},
        ${JSON.stringify(chunk.metadata)}::jsonb,
        ${ConversationMemoryRepository.toVectorLiteral(embedding)}::vector,
        ${new Date(chunk.metadata.createdAt)}
      )`;
    });

    await db.$executeRaw(Prisma.sql`
      INSERT INTO "ai_assistant_conversation_embedding" (
        "id",
        "conversationId",
        "messageId",
        "userId",
        "scope",
        "role",
        "content",
        "metadata",
        "embedding",
        "createdAt"
      )
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("messageId") DO UPDATE SET
        "conversationId" = EXCLUDED."conversationId",
        "userId" = EXCLUDED."userId",
        "scope" = EXCLUDED."scope",
        "role" = EXCLUDED."role",
        "content" = EXCLUDED."content",
        "metadata" = EXCLUDED."metadata",
        "embedding" = EXCLUDED."embedding",
        "createdAt" = EXCLUDED."createdAt"
    `);
  }

  private static toVectorLiteral(values: number[]): string {
    return `[${values.join(",")}]`;
  }
}
