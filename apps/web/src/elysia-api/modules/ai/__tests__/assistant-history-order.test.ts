import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { MastraDBMessage } from "@mastra/core/agent";

const getThreadByIdMock = mock(async () => ({
  id: "assistant:user:test:assistant-widget",
  resourceId: "assistant:user:test",
}));

const recallMock = mock(async () => ({
  messages: [
    createMessage({
      id: "msg_1",
      role: "user",
      content: "First",
      createdAt: new Date("2026-03-10T12:00:00.000Z"),
    }),
    createMessage({
      id: "msg_2",
      role: "assistant",
      content: "Second",
      createdAt: new Date("2026-03-10T12:01:00.000Z"),
    }),
    createMessage({
      id: "msg_3",
      role: "user",
      content: "Third",
      createdAt: new Date("2026-03-10T12:02:00.000Z"),
    }),
    createMessage({
      id: "msg_4",
      role: "assistant",
      content: "Fourth",
      createdAt: new Date("2026-03-10T12:03:00.000Z"),
    }),
  ],
  total: 4,
  page: 0,
  perPage: false,
  hasMore: false,
}));

mock.module("../memory/runtime", () => ({
  ensureAssistantStorageReady: async () => undefined,
  getAssistantMemory: () => ({
    getThreadById: getThreadByIdMock,
    recall: recallMock,
  }),
  getAssistantPostgresStore: () => ({}),
  getAssistantVectorStore: () => ({}),
}));

mock.module("../memory/knowledge", () => ({
  buildAssistantKnowledgeContext: async () => null,
}));

const { ConversationMemoryService } = await import("../memory/service");

function createMessage(options: {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: Date;
}): MastraDBMessage {
  return {
    id: options.id,
    role: options.role,
    createdAt: options.createdAt,
    threadId: "assistant:user:test:assistant-widget",
    resourceId: "assistant:user:test",
    content: {
      format: 2,
      parts: [
        {
          type: "text",
          text: options.content,
        },
      ],
    },
  };
}

const baseConfig = {
  PROMPT_VERSION: "copilot-v1",
  DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: 100,
  ASSISTANT_MAX_STEPS: 4,
  ASSISTANT_HISTORY_LIMIT: 8,
  ASSISTANT_RAG_ENABLED: true,
  ASSISTANT_RAG_TOP_K: 4,
  ASSISTANT_RAG_RECENT_LIMIT: 8,
  ASSISTANT_CONTEXT_TOKEN_LIMIT: 1200,
  ASSISTANT_SYSTEM_PROMPT: "Assistant prompt",
  COPILOT_SYSTEM_PROMPT: "Copilot prompt",
  EMBEDDING_PROVIDER: "openrouter",
  EMBEDDING_MODEL: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
  EMBEDDING_DIMENSIONS: 2048,
  OPTIMIZE_SYSTEM_PROMPT: "Optimize prompt",
} as const;

describe("assistant history ordering", () => {
  beforeEach(() => {
    getThreadByIdMock.mockClear();
    recallMock.mockClear();
  });

  it("returns the latest page in chronological order", async () => {
    const page = await ConversationMemoryService.getHistory({
      config: baseConfig,
      limit: 2,
      resourceId: "assistant:user:test",
      threadId: "assistant:user:test:assistant-widget",
    });

    expect(page.messages.map((message) => message.id)).toEqual(["msg_3", "msg_4"]);
    expect(page.hasMore).toBe(true);
  });
});
