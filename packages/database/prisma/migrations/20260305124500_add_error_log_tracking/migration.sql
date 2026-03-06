-- CreateEnum
CREATE TYPE "error_log_environment" AS ENUM ('development', 'production');

-- CreateTable
CREATE TABLE "error_log" (
    "id" TEXT NOT NULL,
    "errorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stackTraceJson" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "functionName" TEXT,
    "queryParams" JSONB,
    "requestBody" JSONB,
    "headers" JSONB,
    "userId" TEXT,
    "environment" "error_log_environment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "readByUserId" TEXT,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_log_createdAt_idx" ON "error_log"("createdAt");

-- CreateIndex
CREATE INDEX "error_log_isRead_createdAt_idx" ON "error_log"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "error_log_userId_idx" ON "error_log"("userId");

-- CreateIndex
CREATE INDEX "error_log_readByUserId_idx" ON "error_log"("readByUserId");

-- CreateIndex
CREATE INDEX "error_log_environment_createdAt_idx" ON "error_log"("environment", "createdAt");

-- AddForeignKey
ALTER TABLE "error_log" ADD CONSTRAINT "error_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_log" ADD CONSTRAINT "error_log_readByUserId_fkey" FOREIGN KEY ("readByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
