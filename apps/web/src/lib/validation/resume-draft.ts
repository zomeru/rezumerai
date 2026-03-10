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

type ErrorSetter<T> = Dispatch<SetStateAction<T>>;

interface ResumeDraftValidatorDeps {
  setPersonalInfoErrors: ErrorSetter<Record<string, string>>;
  setInvalidExperienceIndices: ErrorSetter<Set<number>>;
  setProjectErrors: ErrorSetter<Record<number, Record<string, string>>>;
  setEducationErrors: ErrorSetter<Record<number, Record<string, string>>>;
}

/**
 * Validates resume draft sections and dispatches error state to the builder UI.
 * Construct once (via useMemo) and call individual section validators or validateAll.
 *
 * @example
 * ```tsx
 * const validator = useMemo(
 *   () => new ResumeDraftValidator({ setPersonalInfoErrors, setInvalidExperienceIndices, setProjectErrors, setEducationErrors }),
 *   [setPersonalInfoErrors, setInvalidExperienceIndices, setProjectErrors, setEducationErrors],
 * );
 *
 * if (!validator.validateAll(draftResume)) return;
 * ```
 */
export class ResumeDraftValidator {
  constructor(private readonly deps: ResumeDraftValidatorDeps) {}

  validatePersonalInfo(resume: ResumeWithRelations): boolean {
    if (!resume.personalInfo) return true;
    const result = validateSchema(PersonalInfoItemSchema, resume.personalInfo);
    if (!result.success) {
      const errors = mapFlatErrors(result.issues);
      this.deps.setPersonalInfoErrors(errors);
      const first = getFirstErrorMessage(errors);
      if (first) toast.error(first);
      return false;
    }
    this.deps.setPersonalInfoErrors({});
    return true;
  }

  validateExperience(resume: ResumeWithRelations): boolean {
    const result = validateSchema(ExperienceArraySchema, resume.experience);
    if (!result.success) {
      this.deps.setInvalidExperienceIndices(mapInvalidIndices(result.issues));
      const first = result.issues[0]?.message;
      if (first) toast.error(first);
      return false;
    }
    this.deps.setInvalidExperienceIndices(new Set());
    return true;
  }

  validateProjects(resume: ResumeWithRelations): boolean {
    const result = validateSchema(ProjectArraySchema, resume.project);
    if (!result.success) {
      const errors = mapIndexedErrors(result.issues);
      this.deps.setProjectErrors(errors);
      const first = getFirstErrorMessage(errors);
      if (first) toast.error(first);
      return false;
    }
    this.deps.setProjectErrors({});
    return true;
  }

  validateEducation(resume: ResumeWithRelations): boolean {
    const result = validateSchema(EducationArraySchema, resume.education);
    if (!result.success) {
      const errors = mapIndexedErrors(result.issues);
      this.deps.setEducationErrors(errors);
      const first = getFirstErrorMessage(errors);
      if (first) toast.error(first);
      return false;
    }
    this.deps.setEducationErrors({});
    return true;
  }

  /** Validates all sections in order. Stops and returns false on the first failure. */
  validateAll(resume: ResumeWithRelations): boolean {
    return (
      this.validatePersonalInfo(resume) &&
      this.validateExperience(resume) &&
      this.validateProjects(resume) &&
      this.validateEducation(resume)
    );
  }
}
