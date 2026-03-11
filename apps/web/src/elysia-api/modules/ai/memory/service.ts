import type { PrismaClient } from "@rezumerai/database";
import type { AiConfiguration, AssistantRoleScope } from "@rezumerai/types";
import { AiRepository } from "../repository";
import type { SavedAssistantConversationMessage } from "../types";
import { type AssistantUiMessage, sanitizeUiMessageParts, toUiMessageParts } from "../ui-message";
import { buildMessageChunks } from "./chunking";
import { embedAssistantTexts } from "./embedder";
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

async function reindexConversationMessages(
  db: DatabaseClient,
  config: AiConfiguration,
  messages: SavedAssistantConversationMessage[],
): Promise<void> {
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

    const queryEmbedding = (await embedAssistantTexts(options.config, [options.latestUserMessage])).embeddings[0];

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
  }> {
    const page = await ConversationMemoryService.getHistory(options);

    return {
      messages: page.messages.map(toUiMessage),
      hasMore: page.hasMore,
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
    );

    return {
      indexedCount: missingMessages.length,
    };
  }
}
