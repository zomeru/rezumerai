-- Fix existing rows: set end_date to NOW() for non-current entries missing an end date
UPDATE "experience"
SET "endDate" = NOW()
WHERE "isCurrent" = FALSE AND "endDate" IS NULL;

-- Add CHECK constraint: end_date must be set when is_current is false
ALTER TABLE "experience"
  ADD CONSTRAINT "experience_end_date_required"
  CHECK ("isCurrent" = TRUE OR "endDate" IS NOT NULL);
