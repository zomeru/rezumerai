import type { Prisma, PrismaClient } from "@rezumerai/database";
import type { AssistantChatMessage, AssistantRoleScope } from "@rezumerai/types";
import { aiConfigurationName, asiaManilaUtcOffsetMs } from "./constants";
import { AiCreditsExhaustedError } from "./errors";
import type {
  AssistantConversationMemoryMessage,
  AssistantConversationRecord,
  AssistantConversationState,
  ConsumeDailyCreditResult,
  DailyCreditsStatus,
  SavedAssistantConversationMessage,
  SaveOptimizationInput,
} from "./types";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;
type CreditsAccessor = {
  aiTextOptimizerCredits: Pick<
    DatabaseClient["aiTextOptimizerCredits"],
    "create" | "findUnique" | "updateMany" | "upsert"
  >;
};

const assistantConversationFallbackStore = new Map<string, AssistantConversationRecord>();

interface ConversationStateOptions {
  conversationKey: string;
  scope: AssistantRoleScope;
  threadId: string;
  userId: string;
  historyLimit: number;
  fallbackHistory: AssistantChatMessage[];
}

interface SaveConversationExchangeOptions {
  conversationId: string;
  conversationKey: string;
  scope: AssistantRoleScope;
  userId: string;
  userMessage: string;
  assistantMessage: string;
  blocks: Prisma.InputJsonValue;
  toolNames: string[];
  persistenceAvailable: boolean;
}

interface PersistAssistantConversationMessageInput {
  id: string;
  role: "assistant" | "user";
  content: string;
  blocks: Prisma.InputJsonValue;
  toolNames: string[];
}

interface SaveConversationMessagesOptions {
  conversationId: string;
  conversationKey: string;
  scope: AssistantRoleScope;
  threadId: string;
  userId: string;
  persistenceAvailable: boolean;
  messages: PersistAssistantConversationMessageInput[];
}

interface AssistantHistoryQueryOptions {
  scope: AssistantRoleScope;
  threadId: string;
  userId: string;
  cursor: {
    createdAt: Date;
    id: string;
  } | null;
  limit: number;
}

interface SaveConversationExchangeResult {
  messages: SavedAssistantConversationMessage[];
}

// biome-ignore lint/complexity/noStaticOnlyClass: The repository intentionally exposes stateless query helpers for the module.
export abstract class AiRepository {
  private static toAssistantMessageRole(role: string): AssistantChatMessage["role"] {
    return role === "assistant" ? "assistant" : "user";
  }

  static async getAiConfigurationValue(db: DatabaseClient): Promise<Prisma.JsonValue | null> {
    const configuration = await db.systemConfiguration.findUnique({
      where: { name: aiConfigurationName },
      select: { value: true },
    });

    return configuration?.value ?? null;
  }

  static async getUserSelectedModelRecord(
    db: DatabaseClient,
    userId: string,
  ): Promise<{ selectedAiModel: string } | null> {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        selectedAiModel: true,
      },
    });
  }

  static async updateUserSelectedModel(db: DatabaseClient, userId: string, modelId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        selectedAiModel: modelId,
      },
    });
  }

  static async consumeDailyCredit(
    db: TransactionCapableDatabaseClient,
    userId: string,
    dailyLimit: number,
    now: Date = new Date(),
  ): Promise<ConsumeDailyCreditResult> {
    const todayBoundary = AiRepository.getAsiaManilaMidnightBoundary(now);

    return db.$transaction(async (tx) => {
      await AiRepository.ensureDailyCreditsWindow(tx, userId, todayBoundary, dailyLimit);

      const consumeResult = await tx.aiTextOptimizerCredits.updateMany({
        where: {
          userId,
          credits: {
            gt: 0,
          },
        },
        data: {
          credits: {
            decrement: 1,
          },
        },
      });

      if (consumeResult.count === 0) {
        throw new AiCreditsExhaustedError();
      }

      const creditsRecord = await tx.aiTextOptimizerCredits.findUnique({
        where: { userId },
        select: { credits: true },
      });

      return { remainingCredits: creditsRecord?.credits ?? 0 };
    });
  }

  static async getDailyCredits(
    db: TransactionCapableDatabaseClient,
    userId: string,
    dailyLimit: number,
    now: Date = new Date(),
  ): Promise<DailyCreditsStatus> {
    const todayBoundary = AiRepository.getAsiaManilaMidnightBoundary(now);
    const existingCredits = await db.aiTextOptimizerCredits.findUnique({
      where: { userId },
      select: {
        credits: true,
        lastResetAt: true,
      },
    });

    if (existingCredits && existingCredits.lastResetAt >= todayBoundary) {
      return {
        remainingCredits: existingCredits.credits,
        dailyLimit,
      };
    }

    return db.$transaction(async (tx) => {
      await AiRepository.ensureDailyCreditsWindow(tx, userId, todayBoundary, dailyLimit);

      const creditsRecord = await tx.aiTextOptimizerCredits.findUnique({
        where: { userId },
        select: { credits: true },
      });

      return {
        remainingCredits: creditsRecord?.credits ?? dailyLimit,
        dailyLimit,
      };
    });
  }

  static async getAssistantConversationState(
    db: DatabaseClient,
    options: ConversationStateOptions,
  ): Promise<AssistantConversationState> {
    try {
      const existingConversation = await db.aiAssistantConversation.findFirst({
        where: {
          scope: options.scope,
          threadId: options.threadId,
          userId: options.userId,
        },
        select: {
          id: true,
          messages: {
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: options.historyLimit,
          },
        },
      });

      if (existingConversation) {
        const recentMessages = existingConversation.messages
          .slice()
          .reverse()
          .map(AiRepository.toConversationMemoryMessage);

        return {
          conversationId: existingConversation.id,
          history: recentMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          recentMessages,
          persistenceAvailable: true,
          conversationKey: options.conversationKey,
          threadId: options.threadId,
        };
      }

      const conversation = await db.aiAssistantConversation.create({
        data: {
          scope: options.scope,
          threadId: options.threadId,
          userId: options.userId,
        },
        select: {
          id: true,
        },
      });

      return {
        conversationId: conversation.id,
        history: [],
        recentMessages: [],
        persistenceAvailable: true,
        conversationKey: options.conversationKey,
        threadId: options.threadId,
      };
    } catch {
      const existingFallbackConversation =
        [...assistantConversationFallbackStore.values()].find(
          (conversation) =>
            conversation.conversationKey === options.conversationKey && conversation.threadId === options.threadId,
        ) ?? null;

      const canReuseFallbackConversation =
        existingFallbackConversation &&
        existingFallbackConversation.scope === options.scope &&
        existingFallbackConversation.userId === options.userId;

      if (canReuseFallbackConversation && existingFallbackConversation) {
        return {
          conversationId: existingFallbackConversation.conversationId,
          history: existingFallbackConversation.history,
          recentMessages: existingFallbackConversation.history.map((message, index) => ({
            id: `fallback:${existingFallbackConversation.conversationId}:${index}`,
            role: message.role,
            content: message.content,
            createdAt: new Date(0),
          })),
          persistenceAvailable: false,
          conversationKey: existingFallbackConversation.conversationKey,
          threadId: existingFallbackConversation.threadId,
        };
      }

      const conversationId = crypto.randomUUID();

      assistantConversationFallbackStore.set(conversationId, {
        conversationId,
        conversationKey: options.conversationKey,
        scope: options.scope,
        threadId: options.threadId,
        userId: options.userId,
        history: options.fallbackHistory,
      });

      return {
        conversationId,
        history: options.fallbackHistory,
        recentMessages: options.fallbackHistory.map((message, index) => ({
          id: `fallback:${conversationId}:${index}`,
          role: message.role,
          content: message.content,
          createdAt: new Date(0),
        })),
        persistenceAvailable: false,
        conversationKey: options.conversationKey,
        threadId: options.threadId,
      };
    }
  }

  static async saveAssistantConversationExchange(
    db: TransactionCapableDatabaseClient,
    options: SaveConversationExchangeOptions,
  ): Promise<SaveConversationExchangeResult> {
    if (!options.persistenceAvailable) {
      const existingConversation = assistantConversationFallbackStore.get(options.conversationId);
      const nextHistory = [
        ...(existingConversation?.history ?? []),
        { role: "user" as const, content: options.userMessage },
        { role: "assistant" as const, content: options.assistantMessage },
      ];

      assistantConversationFallbackStore.set(options.conversationId, {
        conversationId: options.conversationId,
        conversationKey: options.conversationKey,
        scope: existingConversation?.scope ?? options.scope,
        threadId: existingConversation?.threadId ?? "",
        userId: existingConversation?.userId ?? options.userId,
        history: nextHistory,
      });
      return { messages: [] };
    }

    try {
      const messages = await db.$transaction(async (tx) => {
        const userMessage = await tx.aiAssistantConversationMessage.create({
          data: {
            conversationId: options.conversationId,
            role: "user",
            content: options.userMessage,
          },
          select: {
            id: true,
            conversationId: true,
            role: true,
            content: true,
            createdAt: true,
          },
        });
        const assistantMessage = await tx.aiAssistantConversationMessage.create({
          data: {
            conversationId: options.conversationId,
            role: "assistant",
            content: options.assistantMessage,
            blocks: options.blocks,
            toolNames: options.toolNames,
          },
          select: {
            id: true,
            conversationId: true,
            role: true,
            content: true,
            createdAt: true,
          },
        });

        await tx.aiAssistantConversation.update({
          where: { id: options.conversationId },
          data: {
            lastUserMessageAt: new Date(),
          },
        });

        return [userMessage, assistantMessage] satisfies Array<{
          id: string;
          conversationId: string;
          role: string;
          content: string;
          createdAt: Date;
        }>;
      });

      return {
        messages: messages.map((message) => ({
          id: message.id,
          conversationId: message.conversationId,
          scope: options.scope,
          userId: options.userId,
          role: AiRepository.toAssistantMessageRole(message.role),
          content: message.content,
          createdAt: message.createdAt,
        })),
      };
    } catch {
      return { messages: [] };
    }
  }

  static async saveAssistantConversationMessages(
    db: TransactionCapableDatabaseClient,
    options: SaveConversationMessagesOptions,
  ): Promise<SaveConversationExchangeResult> {
    if (!options.persistenceAvailable) {
      const existingConversation = assistantConversationFallbackStore.get(options.conversationId);
      const nextHistory = [
        ...(existingConversation?.history ?? []),
        ...options.messages.map((message) => ({
          role: AiRepository.toAssistantMessageRole(message.role),
          content: message.content,
        })),
      ];

      assistantConversationFallbackStore.set(options.conversationId, {
        conversationId: options.conversationId,
        conversationKey: options.conversationKey,
        scope: existingConversation?.scope ?? options.scope,
        threadId: existingConversation?.threadId ?? options.threadId,
        userId: existingConversation?.userId ?? options.userId,
        history: nextHistory,
      });

      return { messages: [] };
    }

    try {
      const messages = await db.$transaction(async (tx) => {
        const savedMessages: Array<{
          id: string;
          conversationId: string;
          role: string;
          content: string;
          createdAt: Date;
        }> = [];

        for (const message of options.messages) {
          const savedMessage = await tx.aiAssistantConversationMessage.create({
            data: {
              id: message.id,
              conversationId: options.conversationId,
              role: message.role,
              content: message.content,
              blocks: message.blocks,
              toolNames: message.toolNames,
            },
            select: {
              id: true,
              conversationId: true,
              role: true,
              content: true,
              createdAt: true,
            },
          });

          savedMessages.push(savedMessage);
        }

        await tx.aiAssistantConversation.update({
          where: { id: options.conversationId },
          data: {
            lastUserMessageAt: new Date(),
          },
        });

        return savedMessages;
      });

      return {
        messages: messages.map((message) => ({
          id: message.id,
          conversationId: message.conversationId,
          scope: options.scope,
          userId: options.userId,
          role: AiRepository.toAssistantMessageRole(message.role),
          content: message.content,
          createdAt: message.createdAt,
        })),
      };
    } catch {
      return { messages: [] };
    }
  }

  static async getAssistantConversationHistory(
    db: DatabaseClient,
    options: AssistantHistoryQueryOptions,
  ): Promise<{
    messages: Array<{
      id: string;
      role: AssistantChatMessage["role"];
      content: string;
      blocks?: Prisma.JsonValue;
      createdAt: Date;
    }>;
    hasMore: boolean;
  }> {
    const conversation = await db.aiAssistantConversation.findFirst({
      where: {
        scope: options.scope,
        threadId: options.threadId,
        userId: options.userId,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      return {
        messages: [],
        hasMore: false,
      };
    }

    const rows = await db.aiAssistantConversationMessage.findMany({
      where: {
        conversationId: conversation.id,
        ...(options.cursor
          ? {
              OR: [
                {
                  createdAt: {
                    lt: options.cursor.createdAt,
                  },
                },
                {
                  createdAt: options.cursor.createdAt,
                  id: {
                    lt: options.cursor.id,
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        role: true,
        content: true,
        blocks: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: options.limit + 1,
    });

    const hasMore = rows.length > options.limit;
    const pageRows = hasMore ? rows.slice(0, options.limit) : rows;

    return {
      messages: pageRows
        .slice()
        .reverse()
        .map((message) => ({
          id: message.id,
          role: AiRepository.toAssistantMessageRole(message.role),
          content: message.content,
          blocks: message.blocks ?? undefined,
          createdAt: message.createdAt,
        })),
      hasMore,
    };
  }

  private static toConversationMemoryMessage(message: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }): AssistantConversationMemoryMessage {
    return {
      id: message.id,
      role: AiRepository.toAssistantMessageRole(message.role),
      content: message.content,
      createdAt: message.createdAt,
    };
  }

  static async getOwnedResume(db: DatabaseClient, userId: string, resumeId: string) {
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        personalInfo: true,
        experience: true,
        education: true,
        project: true,
      },
    });

    if (!resume) {
      throw new Error("Resume not found.");
    }

    return resume;
  }

  static async resolveOwnedResumeId(
    db: DatabaseClient,
    userId: string,
    resumeId: string | null,
  ): Promise<string | null> {
    if (!resumeId) {
      return null;
    }

    const ownedResume = await db.resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });

    return ownedResume?.id ?? null;
  }

  static async saveOptimization(db: DatabaseClient, payload: SaveOptimizationInput): Promise<void> {
    const inputText = payload.inputText.trim();
    const optimizedText = payload.optimizedText.trim();
    const linkedResumeId = await AiRepository.resolveOwnedResumeId(db, payload.userId, payload.resumeId ?? null);

    await db.aiOptimization.create({
      data: {
        userId: payload.userId,
        resumeId: linkedResumeId,
        inputText,
        optimizedText,
        provider: payload.provider,
        model: payload.model,
        promptVersion: payload.promptVersion,
        status: payload.status,
        inputCharCount: inputText.length,
        outputCharCount: optimizedText.length,
        chunkCount: payload.chunkCount,
        durationMs: payload.durationMs,
        promptTokens: payload.usage.promptTokens,
        completionTokens: payload.usage.completionTokens,
        totalTokens: payload.usage.totalTokens,
        reasoningTokens: payload.usage.reasoningTokens,
        errorMessage: payload.errorMessage ?? null,
      },
    });
  }

  private static getAsiaManilaMidnightBoundary(date: Date): Date {
    const manilaDate = new Date(date.getTime() + asiaManilaUtcOffsetMs);
    manilaDate.setUTCHours(0, 0, 0, 0);

    return new Date(manilaDate.getTime() - asiaManilaUtcOffsetMs);
  }

  private static async ensureDailyCreditsWindow(
    db: CreditsAccessor,
    userId: string,
    todayBoundary: Date,
    dailyLimit: number,
  ): Promise<void> {
    const existingCredits = await db.aiTextOptimizerCredits.findUnique({
      where: { userId },
      select: {
        lastResetAt: true,
      },
    });

    if (existingCredits && existingCredits.lastResetAt >= todayBoundary) {
      return;
    }

    if (!existingCredits) {
      await db.aiTextOptimizerCredits.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          credits: dailyLimit,
          lastResetAt: todayBoundary,
        },
      });
      return;
    }

    await db.aiTextOptimizerCredits.updateMany({
      where: {
        userId,
        lastResetAt: {
          lt: todayBoundary,
        },
      },
      data: {
        credits: dailyLimit,
        lastResetAt: todayBoundary,
      },
    });
  }
}
