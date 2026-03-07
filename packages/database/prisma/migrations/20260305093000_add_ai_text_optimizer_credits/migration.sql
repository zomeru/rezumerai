-- CreateTable
CREATE TABLE "ai_text_optimizer_credits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 100,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_text_optimizer_credits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_text_optimizer_credits_userId_key" ON "ai_text_optimizer_credits"("userId");

-- CreateIndex
CREATE INDEX "ai_text_optimizer_credits_lastResetAt_idx" ON "ai_text_optimizer_credits"("lastResetAt");

-- AddForeignKey
ALTER TABLE "ai_text_optimizer_credits" ADD CONSTRAINT "ai_text_optimizer_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
