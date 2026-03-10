ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;

DELETE FROM "ai_assistant_conversation_embedding"
WHERE "userId" IS NULL;

DELETE FROM "ai_assistant_conversation"
WHERE "userId" IS NULL;

DROP INDEX IF EXISTS "ai_assistant_conversation_guestId_updatedAt_idx";
ALTER TABLE "ai_assistant_conversation"
DROP CONSTRAINT IF EXISTS "ai_assistant_conversation_identityKey_key";

ALTER TABLE "ai_assistant_conversation"
DROP COLUMN IF EXISTS "guestId",
DROP COLUMN IF EXISTS "identityKey";

ALTER TABLE "ai_assistant_conversation"
ALTER COLUMN "userId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_assistant_conversation_userId_scope_key'
  ) THEN
    ALTER TABLE "ai_assistant_conversation"
    ADD CONSTRAINT "ai_assistant_conversation_userId_scope_key" UNIQUE ("userId", "scope");
  END IF;
END $$;

ALTER TABLE "ai_assistant_conversation_embedding"
ALTER COLUMN "userId" SET NOT NULL;
