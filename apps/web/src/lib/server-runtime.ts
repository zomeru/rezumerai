import { prisma } from "@rezumerai/database";
import { headers } from "next/headers";
import { cache } from "react";
import { ResumeService } from "@/elysia-api/modules/resume/service";
import { resolveRequestSessionIdentity } from "./request-auth";

export const getServerRequestHeaders = cache(async () => new Headers(await headers()));

export const getServerSessionIdentity = cache(async () => {
  return resolveRequestSessionIdentity(await getServerRequestHeaders());
});

export const getOwnedResumeForCurrentUser = cache(async (resumeId: string) => {
  const { userId } = await getServerSessionIdentity();

  if (!userId) {
    return null;
  }

  return ResumeService.findById(prisma, userId, resumeId);
});
