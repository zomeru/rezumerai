CREATE TYPE "ai_assistant_conversation_scope" AS ENUM ('PUBLIC', 'USER', 'ADMIN');

CREATE TYPE "ai_assistant_conversation_role" AS ENUM ('user', 'assistant');

CREATE TABLE "ai_assistant_conversation" (
  "id" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "scope" "ai_assistant_conversation_scope" NOT NULL,
  "userId" TEXT,
  "lastUserMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ai_assistant_conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_assistant_conversation_message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "ai_assistant_conversation_role" NOT NULL,
  "content" TEXT NOT NULL,
  "blocks" JSONB,
  "toolNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_assistant_conversation_message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_assistant_conversation_sessionKey_key" ON "ai_assistant_conversation"("sessionKey");
CREATE INDEX "ai_assistant_conversation_userId_updatedAt_idx" ON "ai_assistant_conversation"("userId", "updatedAt");
CREATE INDEX "ai_assistant_conversation_scope_updatedAt_idx" ON "ai_assistant_conversation"("scope", "updatedAt");
CREATE INDEX "ai_assistant_conversation_message_conversationId_createdAt_idx" ON "ai_assistant_conversation_message"("conversationId", "createdAt");

ALTER TABLE "ai_assistant_conversation"
ADD CONSTRAINT "ai_assistant_conversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_assistant_conversation_message"
ADD CONSTRAINT "ai_assistant_conversation_message_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ai_assistant_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
