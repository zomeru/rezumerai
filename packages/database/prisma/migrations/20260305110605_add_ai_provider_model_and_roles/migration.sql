-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "selectedAiModelId" TEXT;

-- CreateTable
CREATE TABLE "ai_provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configuration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_provider_name_key" ON "ai_provider"("name");

-- CreateIndex
CREATE INDEX "ai_model_providerId_idx" ON "ai_model"("providerId");

-- CreateIndex
CREATE INDEX "ai_model_isActive_idx" ON "ai_model"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_providerId_modelId_key" ON "ai_model"("providerId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "system_configuration_name_key" ON "system_configuration"("name");

-- AddForeignKey
ALTER TABLE "ai_model" ADD CONSTRAINT "ai_model_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ai_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_selectedAiModelId_fkey" FOREIGN KEY ("selectedAiModelId") REFERENCES "ai_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;
