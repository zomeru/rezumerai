CREATE TABLE "feature_flag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feature_flag_rolloutPercentage_check" CHECK ("rolloutPercentage" >= 0 AND "rolloutPercentage" <= 100)
);

CREATE UNIQUE INDEX "feature_flag_name_key" ON "feature_flag"("name");
CREATE INDEX "feature_flag_enabled_updatedAt_idx" ON "feature_flag"("enabled", "updatedAt");
