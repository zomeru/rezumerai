/*
  Warnings:

  - You are about to drop the column `createdAt` on the `education` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `education` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `experience` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `experience` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "education" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "experience" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "resume" DROP COLUMN "image";
