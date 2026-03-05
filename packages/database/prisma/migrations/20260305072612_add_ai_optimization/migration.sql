-- CreateEnum
CREATE TYPE "ai_optimization_status" AS ENUM ('success', 'failed', 'aborted');

-- CreateTable
CREATE TABLE "ai_optimization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "inputText" TEXT NOT NULL,
    "optimizedText" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openrouter',
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'optimize-v1',
    "status" "ai_optimization_status" NOT NULL DEFAULT 'success',
    "inputCharCount" INTEGER NOT NULL,
    "outputCharCount" INTEGER NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "reasoningTokens" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_optimization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_optimization_userId_createdAt_idx" ON "ai_optimization"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_optimization_resumeId_idx" ON "ai_optimization"("resumeId");

-- CreateIndex
CREATE INDEX "ai_optimization_status_idx" ON "ai_optimization"("status");
