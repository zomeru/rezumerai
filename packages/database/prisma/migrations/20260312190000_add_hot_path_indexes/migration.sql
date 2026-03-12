CREATE INDEX "resume_userId_updatedAt_idx" ON "resume"("userId", "updatedAt");

CREATE INDEX "user_role_createdAt_idx" ON "user"("role", "createdAt");
