-- CreateEnum
CREATE TYPE "audit_log_category" AS ENUM ('USER_ACTION', 'SYSTEM_ACTIVITY', 'DATABASE_CHANGE');

-- CreateEnum
CREATE TYPE "analytics_event_source" AS ENUM ('API_REQUEST', 'BACKGROUND_JOB');

-- AlterTable
ALTER TABLE "system_configuration" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "category" "audit_log_category" NOT NULL,
    "eventType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "userId" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "serviceName" TEXT,
    "requestMetadata" JSONB,
    "beforeValues" JSONB,
    "afterValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_event" (
    "id" TEXT NOT NULL,
    "source" "analytics_event_source" NOT NULL,
    "eventType" TEXT NOT NULL,
    "endpoint" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "userId" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "errorName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_category_createdAt_idx" ON "audit_log"("category", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_userId_createdAt_idx" ON "audit_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_resourceType_resourceId_idx" ON "audit_log"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_log_eventType_createdAt_idx" ON "audit_log"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_endpoint_createdAt_idx" ON "audit_log"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_source_createdAt_idx" ON "analytics_event"("source", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_endpoint_createdAt_idx" ON "analytics_event"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_userId_createdAt_idx" ON "analytics_event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_statusCode_createdAt_idx" ON "analytics_event"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_isAdmin_createdAt_idx" ON "analytics_event"("isAdmin", "createdAt");

-- CreateIndex
CREATE INDEX "analytics_event_eventType_createdAt_idx" ON "analytics_event"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
