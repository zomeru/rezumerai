import type { Prisma } from "@rezumerai/database";
import { z } from "zod";

/* ---------------------------------- */
/* Enums                              */
/* ---------------------------------- */

export const TEMPLATE_VALUES = [
  "classic",
  "modern",
  "minimal",
  "minimal_image",
] as const;

export const FONT_SIZE_VALUES = ["small", "medium", "large", "custom"] as const;

export const TemplateEnum = z.enum(TEMPLATE_VALUES);
export const FontSizeEnum = z.enum(FONT_SIZE_VALUES);

/* ---------------------------------- */
/* Shared Helpers                     */
/* ---------------------------------- */

/* ---------------------------------- */
/* Personal Information               */
/* ---------------------------------- */

export const PersonalInformationSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    fullName: z.string().min(1),
    email: z.email(),
    phone: z.string().min(7),
    location: z.string(),
    linkedin: z.url(),
    website: z.url(),
    profession: z.string(),
    image: z.url(),
  })
  .strict();

/* ---------------------------------- */
/* Experience                         */
/* ---------------------------------- */

export const ExperienceItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    company: z.string(),
    position: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string(),
    isCurrent: z.boolean(),
  })
  .strict();

export const ExperienceSchema = z.array(ExperienceItemSchema);

/* ---------------------------------- */
/* Education                          */
/* ---------------------------------- */

export const EducationItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    graduationDate: z.string(),
    gpa: z.string(),
  })
  .strict();

export const EducationSchema = z.array(EducationItemSchema);

/* ---------------------------------- */
/* Projects                           */
/* ---------------------------------- */

export const ProjectItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string(),
  })
  .strict();

export const ProjectSchema = z.array(ProjectItemSchema);

/* ---------------------------------- */
/* Resume                             */
/* ---------------------------------- */

export const ResumeObjectSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    public: z.boolean(),
    professionalSummary: z.string().optional(),
    template: TemplateEnum,
    accentColor: z.string(),
    fontSize: FontSizeEnum,
    customFontSize: z.number().optional(),
    skills: z.array(z.string()),
    updatedAt: z.coerce.date(),
    createdAt: z.coerce.date(),
  })
  .strict();

export const ResumeSchema = ResumeObjectSchema.extend({
  personalInfo: PersonalInformationSchema.nullable(),
  experience: ExperienceSchema,
  education: EducationSchema,
  projects: ProjectSchema,
})
  .refine(
    (data) =>
      data.fontSize !== "custom" || typeof data.customFontSize === "number",
    {
      message: "customFontSize is required when fontSize is 'custom'",
      path: ["customFontSize"],
    },
  )
  .strict();

// export const ResumeSchema = z
//   .object({
//     id: z.string(),
//     userId: z.string(),
//     title: z.string(),
//     public: z.boolean(),
//     professionalSummary: z.string().optional(),
//     template: TemplateEnum,
//     accentColor: z.string(),
//     fontSize: FontSizeEnum,
//     customFontSize: z.number().optional(),
//     skills: z.array(z.string()),
//     updatedAt: z.coerce.date(),
//     createdAt: z.coerce.date(),
//     personalInfo: PersonalInformationSchema.nullable(),
//     experience: ExperienceSchema,
//     education: EducationSchema,
//     projects: ProjectSchema,
//   })
//   .refine(
//     (data) =>
//       data.fontSize !== "custom" || typeof data.customFontSize === "number",
//     {
//       message: "customFontSize is required when fontSize is 'custom'",
//       path: ["customFontSize"],
//     },
//   )
//   .strict();

/* ---------------------------------- */
/* Create Input Schemas               */
/* ---------------------------------- */

export const ResumeInputCreateSchema = z
  .object({
    title: z.string(),
    public: z.boolean().default(false),
    professionalSummary: z.string().optional(),
    template: TemplateEnum,
    accentColor: z.string(),
    fontSize: FontSizeEnum,
    customFontSize: z.number().optional(),
    skills: z.array(z.string()),
  })
  .refine(
    (data) =>
      data.fontSize !== "custom" || typeof data.customFontSize === "number",
    {
      message: "customFontSize is required when fontSize is 'custom'",
      path: ["customFontSize"],
    },
  )
  .strict();

export type ResumeResponse = z.infer<typeof ResumeSchema>;

export const PersonalInfoInputCreate = PersonalInformationSchema.omit({
  id: true,
  resumeId: true,
});
export const ExperienceInputCreate = ExperienceSchema.element.omit({
  id: true,
  resumeId: true,
});
export const EducationInputCreate = EducationSchema.element.omit({
  id: true,
  resumeId: true,
});
export const ProjectInputCreate = ProjectSchema.element.omit({
  id: true,
  resumeId: true,
});

export const FullResumeInputCreate = ResumeInputCreateSchema.merge(
  z.object({
    personalInfo: PersonalInfoInputCreate,
    experience: z.array(ExperienceInputCreate),
    education: z.array(EducationInputCreate),
    project: z.array(ProjectInputCreate),
  }),
);

export type ResumeInputCreate = z.infer<typeof ResumeInputCreateSchema>;
export type PersonalInfoInputCreate = z.infer<typeof PersonalInfoInputCreate>;
export type ExperienceInputCreate = z.infer<typeof ExperienceInputCreate>;
export type EducationInputCreate = z.infer<typeof EducationInputCreate>;
export type ProjectInputCreate = z.infer<typeof ProjectInputCreate>;
export type FullResumeInputCreate = z.infer<typeof FullResumeInputCreate>;

export const ResumeInputUpdateSchema = ResumeObjectSchema.omit({
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .strict();

export type ResumeInputUpdate = z.infer<typeof ResumeInputUpdateSchema>;
export type PersonalInfoInputUpdate = Partial<
  z.infer<typeof PersonalInformationSchema>
>;
export type ExperienceInputUpdate = Partial<
  z.infer<typeof ExperienceItemSchema>
>;
export type EducationInputUpdate = Partial<z.infer<typeof EducationItemSchema>>;
export type ProjectInputUpdate = Partial<z.infer<typeof ProjectItemSchema>>;

export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: {
    education: true;
    experience: true;
    project: true;
    personalInfo: true;
    user: true;
  };
}>;
