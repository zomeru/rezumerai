ALTER TABLE "ai_assistant_conversation"
ADD COLUMN "threadId" TEXT NOT NULL DEFAULT 'assistant-widget';

ALTER TABLE "ai_assistant_conversation"
DROP CONSTRAINT IF EXISTS "ai_assistant_conversation_userId_scope_key";

CREATE UNIQUE INDEX "ai_assistant_conversation_userId_scope_threadId_key"
ON "ai_assistant_conversation"("userId", "scope", "threadId");

CREATE INDEX "ai_assistant_conversation_userId_scope_threadId_updatedAt_idx"
ON "ai_assistant_conversation"("userId", "scope", "threadId", "updatedAt");

CREATE INDEX "ai_assistant_conversation_threadId_updatedAt_idx"
ON "ai_assistant_conversation"("threadId", "updatedAt");

ALTER TABLE "ai_assistant_conversation"
ALTER COLUMN "threadId" DROP DEFAULT;
