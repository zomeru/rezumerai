import type { DatabaseClient } from "../types";

export async function getOwnedResume(db: DatabaseClient, userId: string, resumeId: string) {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      personalInfo: true,
      experience: true,
      education: true,
      project: true,
    },
  });

  if (!resume) {
    throw new Error("Resume not found.");
  }

  return resume;
}

export function clampLimit(limit: number | undefined, fallback: number): number {
  return Math.min(10, Math.max(1, limit ?? fallback));
}
