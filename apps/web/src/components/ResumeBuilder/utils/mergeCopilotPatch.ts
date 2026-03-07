import type { ResumeWithRelations } from "@rezumerai/types";

type ResumeCollectionKey = "experience" | "education" | "project";

function mergeCollectionPatch<Key extends ResumeCollectionKey>(
  currentItems: ResumeWithRelations[Key],
  candidateValue: unknown,
): ResumeWithRelations[Key] {
  if (!Array.isArray(candidateValue)) {
    return currentItems;
  }

  return currentItems.map((item) => {
    const matchingPatch = candidateValue.find(
      (candidate): candidate is Record<string, unknown> =>
        typeof candidate === "object" && candidate !== null && candidate.id === item.id,
    );

    return matchingPatch ? { ...item, ...matchingPatch } : item;
  }) as ResumeWithRelations[Key];
}

export function mergeCopilotPatch(draftResume: ResumeWithRelations, patch: unknown): ResumeWithRelations {
  if (!patch || typeof patch !== "object") {
    return draftResume;
  }

  const patchRecord = patch as Record<string, unknown>;
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

  const nextExperience = mergeCollectionPatch(
    nextResume.experience,
    patchRecord.experience,
  ) as ResumeWithRelations["experience"];
  const nextEducation = mergeCollectionPatch(
    nextResume.education,
    patchRecord.education,
  ) as ResumeWithRelations["education"];
  const nextProject = mergeCollectionPatch(nextResume.project, patchRecord.project) as ResumeWithRelations["project"];

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
