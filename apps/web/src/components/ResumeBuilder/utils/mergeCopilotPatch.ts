import type { ResumeWithRelations } from "@rezumerai/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeCollectionPatch<T extends { id: string }>(currentItems: T[], candidateValue: unknown): T[] {
  if (!Array.isArray(candidateValue)) {
    return currentItems;
  }

  return currentItems.map((item) => {
    const matchingPatch = candidateValue.find(
      (candidate): candidate is Record<string, unknown> => isRecord(candidate) && candidate.id === item.id,
    );

    return matchingPatch ? { ...item, ...matchingPatch } : item;
  });
}

export function mergeCopilotPatch(draftResume: ResumeWithRelations, patch: unknown): ResumeWithRelations {
  if (!isRecord(patch)) {
    return draftResume;
  }

  const patchRecord = patch;
  let nextResume = draftResume;

  if (typeof patchRecord.professionalSummary === "string") {
    nextResume = {
      ...nextResume,
      professionalSummary: patchRecord.professionalSummary,
    };
  }

  if (Array.isArray(patchRecord.skills)) {
    nextResume = {
      ...nextResume,
      skills: patchRecord.skills.filter((value): value is string => typeof value === "string"),
    };
  }

  const nextExperience = mergeCollectionPatch(nextResume.experience, patchRecord.experience);
  const nextEducation = mergeCollectionPatch(nextResume.education, patchRecord.education);
  const nextProject = mergeCollectionPatch(nextResume.project, patchRecord.project);

  if (
    nextExperience !== nextResume.experience ||
    nextEducation !== nextResume.education ||
    nextProject !== nextResume.project
  ) {
    nextResume = {
      ...nextResume,
      experience: nextExperience,
      education: nextEducation,
      project: nextProject,
    };
  }

  return nextResume;
}
