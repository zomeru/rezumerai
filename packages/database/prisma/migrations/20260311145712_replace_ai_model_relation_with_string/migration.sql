-- Step 1: Add new string column for selected AI model
ALTER TABLE "user" ADD COLUMN "selected_ai_model" TEXT NOT NULL DEFAULT 'openrouter/free';

-- Step 2: Migrate existing selected model preferences from FK relation to string
UPDATE "user" u
SET "selected_ai_model" = m."modelId"
FROM "ai_model" m
WHERE u."selectedAiModelId" = m."id"
  AND m."modelId" IS NOT NULL;

-- Step 3: Drop the FK constraint before dropping the FK column
ALTER TABLE "user" DROP CONSTRAINT "user_selectedAiModelId_fkey";

-- Step 4: Drop the old FK column
ALTER TABLE "user" DROP COLUMN "selectedAiModelId";

-- Step 5: Drop ai_model table (FK references from ai_model to ai_provider will cascade)
DROP TABLE "ai_model";

-- Step 6: Drop ai_provider table
DROP TABLE "ai_provider";
