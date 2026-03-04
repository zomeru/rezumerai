import { ERROR_MESSAGES } from "@/constants/errors";
import type { CustomResumeWithRelationsInputUpdate } from "./model";

export type ValidationError = {
  message: string;
};

export function validateResumeUpdate(
  input: typeof CustomResumeWithRelationsInputUpdate.static,
): ValidationError | null {
  const { experience, personalInfo, project, education } = input;

  // Validate Experience
  if (experience) {
    for (const exp of experience) {
      if (!exp.position || exp.position.trim() === "") {
        return { message: ERROR_MESSAGES.EXPERIENCE_POSITION_REQUIRED };
      }
      if (!exp.company || exp.company.trim() === "") {
        return { message: ERROR_MESSAGES.EXPERIENCE_COMPANY_REQUIRED };
      }
      if (!exp.startDate) {
        return { message: ERROR_MESSAGES.EXPERIENCE_START_DATE_REQUIRED };
      }
      if (!exp.isCurrent && !exp.endDate) {
        return { message: ERROR_MESSAGES.EXPERIENCE_END_DATE_REQUIRED };
      }
    }
  }

  // Validate Personal Info
  if (personalInfo) {
    if (!personalInfo.fullName || personalInfo.fullName.trim() === "") {
      return { message: ERROR_MESSAGES.PERSONAL_INFO_FULL_NAME_REQUIRED };
    }
    if (!personalInfo.email || personalInfo.email.trim() === "") {
      return { message: ERROR_MESSAGES.PERSONAL_INFO_EMAIL_REQUIRED };
    }
    if (!personalInfo.phone || personalInfo.phone.trim() === "") {
      return { message: ERROR_MESSAGES.PERSONAL_INFO_PHONE_REQUIRED };
    }
    if (!personalInfo.location || personalInfo.location.trim() === "") {
      return { message: ERROR_MESSAGES.PERSONAL_INFO_LOCATION_REQUIRED };
    }
    if (!personalInfo.profession || personalInfo.profession.trim() === "") {
      return { message: ERROR_MESSAGES.PERSONAL_INFO_PROFESSION_REQUIRED };
    }
    if (!personalInfo.linkedin || personalInfo.linkedin.trim() === "") {
      return { message: ERROR_MESSAGES.PERSONAL_INFO_LINKEDIN_REQUIRED };
    }
  }

  // Validate Projects
  if (project) {
    for (const proj of project) {
      if (!proj.name || proj.name.trim() === "") {
        return { message: ERROR_MESSAGES.PROJECT_NAME_REQUIRED };
      }
    }
  }

  // Validate Education
  if (education) {
    for (const edu of education) {
      if (!edu.institution || edu.institution.trim() === "") {
        return { message: ERROR_MESSAGES.EDUCATION_INSTITUTION_REQUIRED };
      }
      if (!edu.degree || edu.degree.trim() === "") {
        return { message: ERROR_MESSAGES.EDUCATION_DEGREE_REQUIRED };
      }
      if (!edu.schoolYearStartDate) {
        return {
          message: ERROR_MESSAGES.EDUCATION_SCHOOL_YEAR_START_DATE_REQUIRED,
        };
      }
      if (!edu.isCurrent && !edu.graduationDate) {
        return {
          message: ERROR_MESSAGES.EXPERIENCE_END_DATE_REQUIRED,
        };
      }
    }
  }

  return null;
}
