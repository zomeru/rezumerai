-- AlterTable
ALTER TABLE "education" ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "schoolYearStartDate" DROP DEFAULT;
