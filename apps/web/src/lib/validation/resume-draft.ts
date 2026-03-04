import {
  EducationArraySchema,
  ExperienceArraySchema,
  PersonalInfoItemSchema,
  ProjectArraySchema,
  type ResumeWithRelations,
} from "@rezumerai/types";
import {
  getFirstErrorMessage,
  mapFlatErrors,
  mapIndexedErrors,
  mapInvalidIndices,
  validateSchema,
} from "@rezumerai/utils";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

export function validateDraftResume(
  draftResume: ResumeWithRelations,
  setters: {
    setPersonalInfoErrors: Dispatch<SetStateAction<Record<string, string>>>;
    setInvalidExperienceIndices: Dispatch<SetStateAction<Set<number>>>;
    setProjectErrors: Dispatch<SetStateAction<Record<number, Record<string, string>>>>;
    setEducationErrors: Dispatch<SetStateAction<Record<number, Record<string, string>>>>;
  },
) {
  const { setPersonalInfoErrors, setInvalidExperienceIndices, setProjectErrors, setEducationErrors } = setters;

  // Personal Info
  if (draftResume.personalInfo) {
    const result = validateSchema(PersonalInfoItemSchema, draftResume.personalInfo);
    if (!result.success) {
      const errors = mapFlatErrors(result.issues);
      setPersonalInfoErrors(errors);
      const firstError = getFirstErrorMessage(errors);
      if (firstError) toast.error(firstError);
      return false;
    }
    setPersonalInfoErrors({});
  }

  // Experience
  const expResult = validateSchema(ExperienceArraySchema, draftResume.experience);
  if (!expResult.success) {
    const invalids = mapInvalidIndices(expResult.issues);
    setInvalidExperienceIndices(invalids);
    const firstError = expResult.issues[0]?.message;
    if (firstError) toast.error(firstError);
    return false;
  }
  setInvalidExperienceIndices(new Set());

  // Projects
  const projectResult = validateSchema(ProjectArraySchema, draftResume.project);
  if (!projectResult.success) {
    const errors = mapIndexedErrors(projectResult.issues);
    setProjectErrors(errors);
    const firstError = getFirstErrorMessage(errors);
    if (firstError) toast.error(firstError);
    return false;
  }
  setProjectErrors({});

  // Education
  const eduResult = validateSchema(EducationArraySchema, draftResume.education);
  if (!eduResult.success) {
    const errors = mapIndexedErrors(eduResult.issues);
    setEducationErrors(errors);
    const firstError = getFirstErrorMessage(errors);
    if (firstError) toast.error(firstError);
    return false;
  }
  setEducationErrors({});

  return true;
}
