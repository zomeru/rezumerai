import type { MastraDBMessage } from "@mastra/core/agent";
import type { PrismaClient } from "@rezumerai/database";
import type { AiConfiguration, AssistantRoleScope } from "@rezumerai/types";
import { buildAssistantMemoryConfig, buildAssistantThreadMetadata } from "./config";
import { buildAssistantKnowledgeContext } from "./knowledge";
import { createAssistantTextMessage, extractAssistantMessageText } from "./message-content";
import { ensureAssistantStorageReady, getAssistantMemory } from "./runtime";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

type AssistantHistoryMessage = {
  content: string;
  createdAt: Date;
  id: string;
  role: "assistant" | "user";
};

// biome-ignore lint/complexity/noStaticOnlyClass: Assistant memory service centralizes Mastra-backed history, retrieval, and knowledge context.
export abstract class ConversationMemoryService {
  static async ensureThread(options: {
    config: AiConfiguration;
    ownerKind: "admin" | "guest" | "user";
    ownerUserId: string;
    resourceId: string;
    scope: AssistantRoleScope;
    threadId: string;
  }): Promise<void> {
    const memory = await ConversationMemoryService.getMemory(options.config);
    const existingThread = await memory.getThreadById({ threadId: options.threadId });

    if (existingThread) {
      if (existingThread.resourceId !== options.resourceId) {
        throw new Error("Assistant thread does not belong to the current resource.");
      }

      return;
    }

    await memory.createThread({
      threadId: options.threadId,
      resourceId: options.resourceId,
      title: "Rezumerai Assistant",
      metadata: buildAssistantThreadMetadata({
        scope: options.scope,
        ownerKind: options.ownerKind,
        ownerUserId: options.ownerUserId,
      }),
    });
  }

  static async buildConversationContext(options: {
    config: AiConfiguration;
    latestUserMessage: string;
    resourceId: string;
    threadId: string;
  }): Promise<AssistantHistoryMessage[]> {
    const memory = await ConversationMemoryService.getMemory(options.config);
    const recalled = await memory.recall({
      threadId: options.threadId,
      resourceId: options.resourceId,
      perPage: false,
      vectorSearchString: options.config.ASSISTANT_RAG_ENABLED ? options.latestUserMessage : undefined,
      threadConfig: buildAssistantMemoryConfig(options.config),
    });

    return ConversationMemoryService.toAssistantHistoryMessages(recalled.messages);
  }

  static async buildKnowledgeContext(options: {
    config: AiConfiguration;
    db: DatabaseClient;
    latestUserMessage: string;
  }) {
    return buildAssistantKnowledgeContext(options);
  }

  static async getHistory(options: {
    config: AiConfiguration;
    cursor?: { createdAt: Date; id: string } | null;
    limit: number;
    resourceId: string;
    threadId: string;
  }): Promise<{ hasMore: boolean; messages: AssistantHistoryMessage[] }> {
    const memory = await ConversationMemoryService.getMemory(options.config);
    const thread = await memory.getThreadById({ threadId: options.threadId });

    if (!thread) {
      return {
        messages: [],
        hasMore: false,
      };
    }

    if (thread.resourceId !== options.resourceId) {
      throw new Error("Assistant thread does not belong to the current resource.");
    }

    const recalled = await memory.recall({
      threadId: options.threadId,
      resourceId: options.resourceId,
      perPage: false,
      orderBy: {
        field: "createdAt",
        direction: "ASC",
      },
    });

    const filteredMessages = ConversationMemoryService.toAssistantHistoryMessages(recalled.messages)
      .filter((message) => {
        if (!options.cursor) {
          return true;
        }

        return (
          message.createdAt.getTime() < options.cursor.createdAt.getTime() ||
          (message.createdAt.getTime() === options.cursor.createdAt.getTime() && message.id < options.cursor.id)
        );
      })
      .slice(-(options.limit + 1));
    const hasMore = filteredMessages.length > options.limit;
    const pageMessages = hasMore ? filteredMessages.slice(1) : filteredMessages;

    return {
      messages: pageMessages,
      hasMore,
    };
  }

  static async saveExchange(options: {
    assistantMessage: string;
    config: AiConfiguration;
    resourceId: string;
    threadId: string;
    userMessage: string;
  }): Promise<void> {
    const memory = await ConversationMemoryService.getMemory(options.config);
    const createdAt = new Date();

    await memory.saveMessages({
      memoryConfig: buildAssistantMemoryConfig(options.config),
      messages: [
        createAssistantTextMessage({
          role: "user",
          content: options.userMessage,
          createdAt,
          resourceId: options.resourceId,
          threadId: options.threadId,
        }),
        createAssistantTextMessage({
          role: "assistant",
          content: options.assistantMessage,
          createdAt: new Date(createdAt.getTime() + 1),
          resourceId: options.resourceId,
          threadId: options.threadId,
        }),
      ],
    });
  }

  static async reindexMissingEmbeddings(
    db: DatabaseClient,
    config: AiConfiguration,
    _limit: number,
  ): Promise<{ indexedCount: number }> {
    await ConversationMemoryService.buildKnowledgeContext({
      config,
      db,
      latestUserMessage: "assistant public content reindex",
    });

    return { indexedCount: 0 };
  }

  private static async getMemory(config: AiConfiguration) {
    await ensureAssistantStorageReady();
    return getAssistantMemory(config);
  }

  private static toAssistantHistoryMessages(messages: MastraDBMessage[]): AssistantHistoryMessage[] {
    return messages
      .filter(
        (message): message is MastraDBMessage & { role: "assistant" | "user" } =>
          message.role === "assistant" || message.role === "user",
      )
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: extractAssistantMessageText(message),
        createdAt: message.createdAt,
      }))
      .filter((message) => message.content.length > 0);
  }
}
