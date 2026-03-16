import type { PrismaClient } from "@rezumerai/database";
import type { AiConfiguration, AssistantRoleScope } from "@rezumerai/types";
import { queueGenerateEmbeddings } from "@/elysia-api/modules/jobs";
import { isJobQueueInitialized } from "@/elysia-api/modules/jobs/queue";
import { AiRepository } from "../repository";
import type { SavedAssistantConversationMessage } from "../types";
import { type AssistantUiMessage, sanitizeUiMessageParts, toUiMessageParts } from "../ui-message";
import { buildMessageChunks } from "./chunking";
import { embedAssistantTexts } from "./embedder";
import { getQueryEmbeddingCache } from "./query-embedding-cache";
import { ConversationMemoryRepository } from "./repository";
import { assembleConversationContext, type ConversationContextMessage } from "./retrieval";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

interface GetAssistantConversationStateOptions {
  config: AiConfiguration;
  scope: AssistantRoleScope;
  threadId: string;
  userId: string;
}

interface SaveAssistantUiTurnOptions extends GetAssistantConversationStateOptions {
  assistantMessage: {
    content: string;
    id: string;
    parts: AssistantUiMessage["parts"];
    toolNames: string[];
  };
  db: TransactionCapableDatabaseClient;
  userMessage: {
    content: string;
    id: string;
    parts: AssistantUiMessage["parts"];
  };
}

function buildConversationKey(options: { scope: AssistantRoleScope; threadId: string; userId: string }): string {
  return `assistant:${options.scope}:${options.userId}:${options.threadId}`;
}

function toConversationContextMessage(message: {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: Date;
}): ConversationContextMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

function formatSemanticMemoryContext(messages: ConversationContextMessage[]): string | null {
  if (messages.length === 0) {
    return null;
  }

  const lines = [
    "Relevant earlier conversation excerpts. Use only when they help answer the latest message:",
    ...messages.map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`),
  ];

  return lines.join("\n");
}

function toUiMessage(message: {
  id: string;
  role: "assistant" | "user";
  content: string;
  blocks?: unknown;
}): AssistantUiMessage {
  return {
    id: message.id,
    role: message.role,
    parts: toUiMessageParts({
      blocks: message.blocks,
      content: message.content,
      role: message.role,
    }),
  };
}

/**
 * Reindex conversation messages - queues as background job if available.
 * Falls back to inline processing if queue is unavailable.
 */
async function reindexConversationMessages(
  db: DatabaseClient,
  config: AiConfiguration,
  messages: SavedAssistantConversationMessage[],
  useBackgroundJobs = true,
): Promise<void> {
  if (messages.length === 0) {
    return;
  }

  // If background jobs are enabled and queue is available, queue the work
  if (useBackgroundJobs && isJobQueueInitialized()) {
    const conversationId = messages[0]?.conversationId;
    const messageIds = messages.map((m) => m.id);

    if (conversationId) {
      // Fire-and-forget: don't await the queue operation
      // This ensures the response isn't blocked
      queueGenerateEmbeddings(conversationId, messageIds, config)
        .then((jobId) => {
          if (jobId) {
            console.log(`[MEMORY] Queued embedding generation for ${messageIds.length} messages (job: ${jobId})`);
          }
        })
        .catch((error) => {
          console.warn(`[MEMORY] Failed to queue embeddings, will process inline:`, error.message);
          // Silently fail - embeddings will be generated later or on next message
        });
      return; // Exit early - work will be done in background
    }
  }

  // Fallback: inline processing (for when queue is unavailable)
  const chunks = buildMessageChunks(
    messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      userId: message.userId,
      scope: message.scope,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    })),
  );

  if (chunks.length === 0) {
    return;
  }

  const { embeddings } = await embedAssistantTexts(
    config,
    chunks.map((chunk) => chunk.content),
  );

  await ConversationMemoryRepository.upsertEmbeddings(db, {
    chunks,
    embeddings,
  });
}

// biome-ignore lint/complexity/noStaticOnlyClass: AI conversation memory is intentionally centralized here.
export abstract class ConversationMemoryService {
  private static async getConversationState(db: DatabaseClient, options: GetAssistantConversationStateOptions) {
    return AiRepository.getAssistantConversationState(db, {
      conversationKey: buildConversationKey({
        scope: options.scope,
        threadId: options.threadId,
        userId: options.userId,
      }),
      scope: options.scope,
      threadId: options.threadId,
      userId: options.userId,
      historyLimit: Math.max(options.config.ASSISTANT_HISTORY_LIMIT, options.config.ASSISTANT_RAG_RECENT_LIMIT),
      fallbackHistory: [],
    });
  }

  static async buildPromptContext(options: {
    config: AiConfiguration;
    db: DatabaseClient;
    latestUserMessage: string;
    scope: AssistantRoleScope;
    threadId: string;
    userId: string;
  }): Promise<{
    conversationId: string | null;
    conversationKey: string;
    memoryContext: string | null;
    messages: AssistantUiMessage[];
    persistenceAvailable: boolean;
    usedMemory: boolean;
  }> {
    const state = await ConversationMemoryService.getConversationState(options.db, {
      config: options.config,
      scope: options.scope,
      threadId: options.threadId,
      userId: options.userId,
    });

    const recentPage = await AiRepository.getAssistantConversationHistory(options.db, {
      scope: options.scope,
      threadId: options.threadId,
      userId: options.userId,
      cursor: null,
      limit: options.config.ASSISTANT_RAG_RECENT_LIMIT,
    });
    const recentConversationMessages = recentPage.messages.map(toConversationContextMessage);
    const defaultMessages = recentPage.messages.map(toUiMessage);

    if (
      !options.config.ASSISTANT_RAG_ENABLED ||
      !state.persistenceAvailable ||
      !state.conversationId ||
      !options.latestUserMessage.trim()
    ) {
      return {
        conversationId: state.conversationId,
        conversationKey: state.conversationKey,
        memoryContext: null,
        messages: defaultMessages,
        persistenceAvailable: state.persistenceAvailable,
        usedMemory: defaultMessages.length > 0,
      };
    }

    // Try to get embedding from cache first
    const cache = getQueryEmbeddingCache();
    let queryEmbedding = cache.get(options.latestUserMessage, options.config);

    // Generate embedding if not in cache
    if (!queryEmbedding) {
      const result = await embedAssistantTexts(options.config, [options.latestUserMessage]);
      queryEmbedding = result.embeddings[0] ?? null;

      // Cache the new embedding
      if (queryEmbedding) {
        cache.set(options.latestUserMessage, options.config, queryEmbedding);
      }
    }

    if (!queryEmbedding) {
      return {
        conversationId: state.conversationId,
        conversationKey: state.conversationKey,
        memoryContext: null,
        messages: defaultMessages,
        persistenceAvailable: state.persistenceAvailable,
        usedMemory: defaultMessages.length > 0,
      };
    }

    const semanticMatches = await ConversationMemoryRepository.querySimilarConversationMessages(options.db, {
      conversationId: state.conversationId,
      scope: options.scope,
      userId: options.userId,
      queryEmbedding,
      topK: options.config.ASSISTANT_RAG_TOP_K,
      excludeMessageIds: recentConversationMessages.map((message) => message.id),
    });
    const assembledContext = assembleConversationContext({
      recentMessages: recentConversationMessages,
      semanticMatches,
      tokenLimit: options.config.ASSISTANT_CONTEXT_TOKEN_LIMIT,
    });
    const allowedMessageIds = new Set(assembledContext.messages.map((message) => message.id));
    const semanticMessageIds = new Set(assembledContext.semanticMatchIds);
    const modelMessages = recentPage.messages.filter((message) => allowedMessageIds.has(message.id)).map(toUiMessage);
    const semanticMemoryMessages = assembledContext.messages.filter((message) => semanticMessageIds.has(message.id));

    return {
      conversationId: state.conversationId,
      conversationKey: state.conversationKey,
      memoryContext: formatSemanticMemoryContext(semanticMemoryMessages),
      messages: modelMessages,
      persistenceAvailable: state.persistenceAvailable,
      usedMemory: modelMessages.length > 0 || semanticMemoryMessages.length > 0,
    };
  }

  static async getHistory(options: {
    db: DatabaseClient;
    cursor?: { createdAt: Date; id: string } | null;
    limit: number;
    scope: AssistantRoleScope;
    threadId: string;
    userId: string;
  }): Promise<{
    hasMore: boolean;
    messages: Array<{
      id: string;
      role: "assistant" | "user";
      content: string;
      blocks?: unknown;
      createdAt: Date;
    }>;
  }> {
    return AiRepository.getAssistantConversationHistory(options.db, {
      scope: options.scope,
      threadId: options.threadId,
      userId: options.userId,
      cursor: options.cursor ?? null,
      limit: options.limit,
    });
  }

  static async getUiMessagePage(options: {
    db: DatabaseClient;
    cursor?: { createdAt: Date; id: string } | null;
    limit: number;
    scope: AssistantRoleScope;
    threadId: string;
    userId: string;
  }): Promise<{
    hasMore: boolean;
    messages: AssistantUiMessage[];
    oldestMessageCursor: {
      createdAt: Date;
      id: string;
    } | null;
  }> {
    const page = await ConversationMemoryService.getHistory(options);
    const oldestMessage = page.messages[0] ?? null;

    return {
      messages: page.messages.map(toUiMessage),
      hasMore: page.hasMore,
      oldestMessageCursor: oldestMessage
        ? {
            createdAt: oldestMessage.createdAt,
            id: oldestMessage.id,
          }
        : null,
    };
  }

  static async saveAssistantUiTurn(options: SaveAssistantUiTurnOptions): Promise<void> {
    const state = await ConversationMemoryService.getConversationState(options.db, {
      config: options.config,
      scope: options.scope,
      threadId: options.threadId,
      userId: options.userId,
    });

    if (!state.conversationId) {
      throw new Error("Assistant conversation could not be initialized.");
    }

    const savedMessages = await AiRepository.saveAssistantConversationMessages(options.db, {
      conversationId: state.conversationId,
      conversationKey: state.conversationKey,
      scope: options.scope,
      threadId: options.threadId,
      userId: options.userId,
      persistenceAvailable: state.persistenceAvailable,
      messages: [
        {
          id: options.userMessage.id,
          role: "user",
          content: options.userMessage.content,
          blocks: sanitizeUiMessageParts({
            parts: options.userMessage.parts,
          }),
          toolNames: [],
        },
        {
          id: options.assistantMessage.id,
          role: "assistant",
          content: options.assistantMessage.content,
          blocks: sanitizeUiMessageParts({
            parts: options.assistantMessage.parts,
          }),
          toolNames: options.assistantMessage.toolNames,
        },
      ],
    });

    if (savedMessages.messages.length > 0) {
      await reindexConversationMessages(options.db, options.config, savedMessages.messages);
    }
  }

  static async reindexMissingEmbeddings(
    db: DatabaseClient,
    config: AiConfiguration,
    limit: number,
  ): Promise<{ indexedCount: number }> {
    const missingMessages = await ConversationMemoryRepository.listMessagesMissingEmbeddings(db, limit);

    if (missingMessages.length === 0) {
      return { indexedCount: 0 };
    }

    // Group by conversation for efficient background processing
    const conversationMap = new Map<string, SavedAssistantConversationMessage[]>();
    for (const message of missingMessages) {
      const existing = conversationMap.get(message.conversationId) ?? [];
      existing.push(message);
      conversationMap.set(message.conversationId, existing);
    }

    // Queue each conversation for reindexing
    if (isJobQueueInitialized()) {
      let queuedCount = 0;
      // Fire-and-forget: don't await individual queue operations
      Promise.all(
        Array.from(conversationMap.entries()).map(async ([conversationId, messages]) => {
          const messageIds = messages.map((m) => m.id);
          try {
            const jobId = await queueGenerateEmbeddings(conversationId, messageIds, config);
            if (jobId) {
              queuedCount += messages.length;
              console.log(
                `[MEMORY] Queued ${messages.length} embeddings for conversation ${conversationId} (job: ${jobId})`,
              );
            }
          } catch (error) {
            console.warn(`[MEMORY] Failed to queue embeddings for conversation ${conversationId}:`, error);
          }
        }),
      ).catch((error) => {
        console.warn(`[MEMORY] Background reindexing failed:`, error);
      });

      // Return immediately - work happens in background
      return { indexedCount: queuedCount };
    }

    // Fallback: inline processing
    await reindexConversationMessages(
      db,
      config,
      missingMessages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        scope: message.scope,
        userId: message.userId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
      false, // Force inline processing
    );

    return {
      indexedCount: missingMessages.length,
    };
  }
}
