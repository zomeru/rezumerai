import type { EducationPlain } from "@rezumerai/database/generated/prismabox/Education";
import type { ExperiencePlain } from "@rezumerai/database/generated/prismabox/Experience";
import type { PersonalInformationPlain } from "@rezumerai/database/generated/prismabox/PersonalInformation";
import type { ProjectPlain } from "@rezumerai/database/generated/prismabox/Project";
import type { Resume, ResumePlain } from "@rezumerai/database/generated/prismabox/Resume";
import { z } from "zod";
import type { DeepPartial } from "../helpers";

export type ResumeWithRelations = Omit<(typeof Resume)["static"], "user">;

type _ResumeWithRelationsInputUpdate = typeof ResumePlain.static &
  DeepPartial<{
    personalInfo: typeof PersonalInformationPlain.static;
    experience: (typeof ExperiencePlain.static)[];
    education: (typeof EducationPlain.static)[];
    project: (typeof ProjectPlain.static)[];
  }>;

export type ResumeWithRelationsInputUpdate = DeepPartial<_ResumeWithRelationsInputUpdate>;

const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;

export const PersonalInfoItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Please enter a valid email address"),
    phone: z.string().min(1, "Phone number is required"),
    location: z.string().min(1, "Location is required"),
    profession: z.string().min(1, "Profession is required"),
    linkedin: z
      .string()
      .min(1, "LinkedIn URL is required")
      .refine((val) => linkedinRegex.test(val), {
        message: "Please enter a valid LinkedIn URL",
      }),
    website: z.url("Please enter a valid website URL"),
    image: z.string().optional(),
  })
  .strict();

export const ExperienceItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    company: z.string().min(1, "Company is required"),
    position: z.string().min(1, "Position is required"),
    description: z.string().optional(),
    isCurrent: z.boolean(),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "Start date is required",
        path: ["startDate"],
      });
    }
    if (!data.isCurrent && data.endDate === null) {
      ctx.addIssue({
        code: "custom",
        message: "End date is required for non-current positions",
        path: ["endDate"],
      });
    }
  });

export const ExperienceArraySchema = z.array(ExperienceItemSchema);

export const ProjectItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    name: z.string().min(1, "Project name is required"),
    type: z.string().optional(),
    description: z.string().optional(),
  })
  .strict();

export const ProjectArraySchema = z.array(ProjectItemSchema);

export const EducationItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    field: z.string().optional(),
    schoolYearStartDate: z.date().nullable(),
    graduationDate: z.date().nullable(),
    isCurrent: z.boolean(),
    gpa: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.schoolYearStartDate) {
      ctx.addIssue({
        code: "custom",
        message: "School year start date is required",
        path: ["schoolYearStartDate"],
      });
    }
    if (data.isCurrent === true && data.graduationDate !== null) {
      ctx.addIssue({
        code: "custom",
        message: "Graduation date must be empty when currently studying",
        path: ["graduationDate"],
      });
    }
  });

export const EducationArraySchema = z.array(EducationItemSchema);
