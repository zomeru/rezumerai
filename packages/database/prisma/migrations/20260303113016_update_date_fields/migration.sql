/*
  Warnings:

  - The `endDate` column on the `experience` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `graduationDate` on the `education` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `startDate` on the `experience` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "education" ALTER COLUMN "institution" SET DEFAULT '',
ALTER COLUMN "degree" SET DEFAULT '',
DROP COLUMN "graduationDate",
ADD COLUMN     "graduationDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "experience" ALTER COLUMN "company" SET DEFAULT '',
ALTER COLUMN "position" SET DEFAULT '',
DROP COLUMN "startDate",
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "endDate",
ADD COLUMN     "endDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "name" SET DEFAULT '';

-- AlterTable
ALTER TABLE "resume" ALTER COLUMN "title" SET DEFAULT '';
