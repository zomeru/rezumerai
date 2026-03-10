import type { PrismaClient } from "@rezumerai/database";
import type { AiConfiguration, AssistantRoleScope } from "@rezumerai/types";
import { EmbeddingService } from "../embeddings/service";
import type { SavedAssistantConversationMessage } from "../types";
import { buildMessageChunks } from "./chunking";
import { ConversationMemoryRepository } from "./repository";
import {
  type AssembledConversationContext,
  assembleConversationContext,
  type ConversationContextMessage,
} from "./retrieval";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

interface BuildConversationContextOptions {
  db: DatabaseClient;
  config: AiConfiguration;
  conversationId: string | null;
  scope: AssistantRoleScope;
  userId: string | null;
  latestUserMessage: string;
  recentMessages: ConversationContextMessage[];
}

// biome-ignore lint/complexity/noStaticOnlyClass: Memory service coordinates retrieval and async indexing without carrying state.
export abstract class ConversationMemoryService {
  static async buildConversationContext(
    options: BuildConversationContextOptions,
  ): Promise<AssembledConversationContext> {
    if (!options.config.ASSISTANT_RAG_ENABLED || !options.conversationId) {
      return assembleConversationContext({
        recentMessages: options.recentMessages.slice(-options.config.ASSISTANT_RAG_RECENT_LIMIT),
        semanticMatches: [],
        tokenLimit: options.config.ASSISTANT_CONTEXT_TOKEN_LIMIT,
      });
    }

    try {
      const provider = EmbeddingService.createProvider(options.config);
      const queryEmbedding = await provider.embed(options.latestUserMessage);
      const retrievedMatches = await ConversationMemoryRepository.querySimilarConversationMessages(options.db, {
        conversationId: options.conversationId,
        scope: options.scope,
        userId: options.userId,
        queryEmbedding,
        topK: options.config.ASSISTANT_RAG_TOP_K,
        excludeMessageIds: options.recentMessages.map((message) => message.id),
      });
      const context = assembleConversationContext({
        recentMessages: options.recentMessages.slice(-options.config.ASSISTANT_RAG_RECENT_LIMIT),
        semanticMatches: retrievedMatches,
        tokenLimit: options.config.ASSISTANT_CONTEXT_TOKEN_LIMIT,
      });

      console.info(
        `[AI][RAG] retrieved=${retrievedMatches.length} scores=${retrievedMatches
          .map((match) => match.score.toFixed(3))
          .join(",")} contextMessages=${context.messages.length} approxTokens=${context.approxTokenCount}`,
      );

      return context;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`[AI][RAG] Failed to build semantic context: ${message}`);

      return assembleConversationContext({
        recentMessages: options.recentMessages.slice(-options.config.ASSISTANT_RAG_RECENT_LIMIT),
        semanticMatches: [],
        tokenLimit: options.config.ASSISTANT_CONTEXT_TOKEN_LIMIT,
      });
    }
  }

  static scheduleEmbeddingIndex(options: {
    db: DatabaseClient;
    config: AiConfiguration;
    messages: SavedAssistantConversationMessage[];
  }): void {
    if (!options.config.ASSISTANT_RAG_ENABLED || options.messages.length === 0) {
      return;
    }

    void ConversationMemoryService.indexMessages(options).catch((error) => {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`[AI][RAG] Failed to index conversation embeddings: ${message}`);
    });
  }

  static async reindexMissingEmbeddings(
    db: DatabaseClient,
    config: AiConfiguration,
    limit: number,
  ): Promise<{ indexedCount: number }> {
    const records = await ConversationMemoryRepository.listMessagesMissingEmbeddings(db, limit);

    if (records.length === 0) {
      return { indexedCount: 0 };
    }

    await ConversationMemoryService.indexMessages({
      db,
      config,
      messages: records.map((record) => ({
        id: record.id,
        conversationId: record.conversationId,
        userId: record.userId,
        scope: record.scope,
        role: record.role,
        content: record.content,
        createdAt: record.createdAt,
      })),
    });

    return { indexedCount: records.length };
  }

  private static async indexMessages(options: {
    db: DatabaseClient;
    config: AiConfiguration;
    messages: SavedAssistantConversationMessage[];
  }): Promise<void> {
    const chunks = buildMessageChunks(options.messages);

    if (chunks.length === 0) {
      return;
    }

    const provider = EmbeddingService.createProvider(options.config);
    const embeddings = await EmbeddingService.embedInBatches({
      provider,
      texts: chunks.map((chunk) => chunk.content),
      onBatchComplete: ({ batchIndex, batchSize, durationMs }) => {
        console.info(`[AI][RAG] embeddings batch=${batchIndex} size=${batchSize} durationMs=${durationMs.toFixed(1)}`);
      },
    });

    await ConversationMemoryRepository.upsertEmbeddings(options.db, {
      chunks,
      embeddings,
    });
  }
}
