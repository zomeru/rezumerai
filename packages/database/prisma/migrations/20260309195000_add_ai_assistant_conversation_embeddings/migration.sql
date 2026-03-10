CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "ai_assistant_conversation_embedding" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT,
  "scope" "ai_assistant_conversation_scope" NOT NULL,
  "role" "ai_assistant_conversation_role" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  -- Keep dimensions fixed so pgvector similarity operators cannot hit
  -- mixed-length rows at query time.
  "embedding" VECTOR(2048) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_assistant_conversation_embedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_assistant_conversation_embedding_messageId_key"
ON "ai_assistant_conversation_embedding"("messageId");

CREATE INDEX "ai_assistant_conversation_embedding_conversationId_createdAt_idx"
ON "ai_assistant_conversation_embedding"("conversationId", "createdAt");

CREATE INDEX "ai_assistant_conversation_embedding_conversationId_scope_userId_createdAt_idx"
ON "ai_assistant_conversation_embedding"("conversationId", "scope", "userId", "createdAt");

CREATE INDEX "ai_assistant_conversation_embedding_userId_scope_createdAt_idx"
ON "ai_assistant_conversation_embedding"("userId", "scope", "createdAt");

ALTER TABLE "ai_assistant_conversation_embedding"
ADD CONSTRAINT "ai_assistant_conversation_embedding_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ai_assistant_conversation"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ai_assistant_conversation_embedding"
ADD CONSTRAINT "ai_assistant_conversation_embedding_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "ai_assistant_conversation_message"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ai_assistant_conversation_embedding"
ADD CONSTRAINT "ai_assistant_conversation_embedding_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
