/*
  Warnings:

  - You are about to drop the column `profession` on the `resume` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "resume" DROP COLUMN "profession",
DROP COLUMN "website";
