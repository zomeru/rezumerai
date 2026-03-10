ALTER TABLE "ai_assistant_conversation"
RENAME COLUMN "sessionKey" TO "identityKey";

ALTER TABLE "ai_assistant_conversation"
ADD COLUMN "guestId" TEXT;

ALTER INDEX "ai_assistant_conversation_sessionKey_key"
RENAME TO "ai_assistant_conversation_identityKey_key";

CREATE INDEX "ai_assistant_conversation_guestId_updatedAt_idx"
ON "ai_assistant_conversation"("guestId", "updatedAt");
