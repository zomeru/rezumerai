import type { Prisma } from "@rezumerai/database";
import { z } from "zod";
import type { DeepPartial } from "../helpers";

type ResumeRelationsInclude = {
  education: true;
  experience: true;
  personalInfo: true;
  project: true;
};

export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: ResumeRelationsInclude;
}>;

export type ResumeListItem = Pick<ResumeWithRelations, "id" | "title" | "updatedAt">;

export type ResumeWithRelationsInputUpdate = DeepPartial<
  Pick<
    ResumeWithRelations,
    | "title"
    | "public"
    | "professionalSummary"
    | "template"
    | "accentColor"
    | "fontSize"
    | "customFontSize"
    | "skills"
    | "personalInfo"
    | "experience"
    | "education"
    | "project"
  >
>;

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
    website: z.string().optional(),
    image: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.website) return;

    function addIssue() {
      ctx.addIssue({
        code: "custom",
        message: "Please enter a valid URL for the website",
        path: ["website"],
      });
    }

    try {
      const url = new URL(data.website);

      if (!["http:", "https:"].includes(url.protocol)) {
        addIssue();
      }
    } catch {
      addIssue();
    }
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
