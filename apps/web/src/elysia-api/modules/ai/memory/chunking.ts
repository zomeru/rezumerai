import type { AssistantRoleScope } from "@rezumerai/types";

export interface ConversationMemoryMessageChunkInput {
  id: string;
  conversationId: string;
  userId: string | null;
  scope: AssistantRoleScope;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationMemoryChunk {
  id: string;
  conversationId: string;
  messageId: string;
  userId: string | null;
  scope: AssistantRoleScope;
  role: "user" | "assistant";
  content: string;
  metadata: {
    conversationId: string;
    messageId: string;
    userId: string | null;
    scope: AssistantRoleScope;
    role: "user" | "assistant";
    createdAt: string;
  };
}

export function buildMessageChunks(messages: ConversationMemoryMessageChunkInput[]): ConversationMemoryChunk[] {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      id: `conversation-message:${message.id}`,
      conversationId: message.conversationId,
      messageId: message.id,
      userId: message.userId,
      scope: message.scope,
      role: message.role,
      content: message.content.trim(),
      metadata: {
        conversationId: message.conversationId,
        messageId: message.id,
        userId: message.userId,
        scope: message.scope,
        role: message.role,
        createdAt: message.createdAt.toISOString(),
      },
    }));
}
