import type { AssistantChatMessage } from "@rezumerai/types";

export interface ConversationContextMessage {
  id: string;
  role: AssistantChatMessage["role"];
  content: string;
  createdAt: Date;
}

export interface SemanticConversationMatch extends ConversationContextMessage {
  score: number;
}

export interface AssembledConversationContext {
  approxTokenCount: number;
  messages: ConversationContextMessage[];
  semanticMatchIds: string[];
}

export function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

export function assembleConversationContext(options: {
  recentMessages: ConversationContextMessage[];
  semanticMatches: SemanticConversationMatch[];
  tokenLimit: number;
}): AssembledConversationContext {
  const recentMessageIds = new Set(options.recentMessages.map((message) => message.id));
  const semanticMatchIds = options.semanticMatches
    .map((message) => message.id)
    .filter((messageId) => !recentMessageIds.has(messageId));

  const mergedById = new Map<string, ConversationContextMessage>();

  for (const message of options.semanticMatches) {
    mergedById.set(message.id, {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    });
  }

  for (const message of options.recentMessages) {
    mergedById.set(message.id, message);
  }

  const orderedMessages = [...mergedById.values()].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const withinBudget = [...orderedMessages];

  while (withinBudget.length > 0 && sumTokenCount(withinBudget) > options.tokenLimit) {
    withinBudget.shift();
  }

  return {
    approxTokenCount: sumTokenCount(withinBudget),
    messages: withinBudget,
    semanticMatchIds: semanticMatchIds.filter((messageId) => withinBudget.some((message) => message.id === messageId)),
  };
}

function sumTokenCount(messages: ConversationContextMessage[]): number {
  return messages.reduce((total, message) => total + estimateTokenCount(message.content), 0);
}
