-- Add schoolYearStartDate column with default value for existing rows
ALTER TABLE "education" ADD COLUMN "schoolYearStartDate" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Make graduationDate nullable
ALTER TABLE "education" ALTER COLUMN "graduationDate" DROP NOT NULL;
