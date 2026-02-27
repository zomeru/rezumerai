import type { Prisma } from "@rezumerai/database";
import { z } from "zod";

/* ---------------------------------- */
/* Enums                              */
/* ---------------------------------- */

export const TEMPLATE_VALUES = ["classic", "modern", "minimal", "minimal_image"] as const;

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
    fullName: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    linkedin: z.string(),
    website: z.string(),
    profession: z.string(),
    image: z.string(),
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
    startDate: z.date(),
    endDate: z.date().nullable(),
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
    graduationDate: z.date(),
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

export const ProjectInputCreate = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
});

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
  project: ProjectSchema,
})
  .refine((data) => data.fontSize !== "custom" || typeof data.customFontSize === "number", {
    message: "customFontSize is required when fontSize is 'custom'",
    path: ["customFontSize"],
  })
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
  .refine((data) => data.fontSize !== "custom" || typeof data.customFontSize === "number", {
    message: "customFontSize is required when fontSize is 'custom'",
    path: ["customFontSize"],
  })
  .strict();

// export type ResumeWithRelations = z.infer<typeof ResumeSchema>;

export const PersonalInfoInputCreate = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string(),
  website: z.string(),
  profession: z.string(),
  image: z.string(),
});
export const ExperienceInputCreate = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  description: z.string(),
  isCurrent: z.boolean(),
});
export const EducationInputCreate = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduationDate: z.date(),
  gpa: z.string(),
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
export type PersonalInfoInputUpdate = Partial<z.infer<typeof PersonalInformationSchema>>;
export type ExperienceInputUpdate = Partial<z.infer<typeof ExperienceItemSchema>>;
export type EducationInputUpdate = Partial<z.infer<typeof EducationItemSchema>>;
export type ProjectInputUpdate = Partial<z.infer<typeof ProjectItemSchema>>;

export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: {
    education: true;
    experience: true;
    project: true;
    personalInfo: true;
  };
}>;

// ── Update schemas for PATCH /resumes/:id ─────────────────────────────────

/** Scalar resume fields for partial update (no id, userId, or timestamps) */
export const ResumeScalarUpdateSchema = ResumeObjectSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

/** Experience item for update — id is optional (omit for new items); strips Prisma's resumeId */
export const ExperienceUpdateItemSchema = ExperienceItemSchema.omit({
  resumeId: true,
})
  .extend({ id: z.string().optional() })
  .strip();

/** Education item for update — id is optional (omit for new items); strips Prisma's resumeId */
export const EducationUpdateItemSchema = z
  .object({
    id: z.string().optional(),
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    graduationDate: z.date(),
    gpa: z.string(),
  })
  .strip();

/** Project item for update — id is optional (omit for new items); strips Prisma's resumeId */
export const ProjectUpdateItemSchema = ProjectItemSchema.omit({
  resumeId: true,
})
  .extend({ id: z.string().optional() })
  .strip();

/**
 * PersonalInfo for PATCH — strips Prisma fields (id, resumeId) and accepts empty strings
 * so users can save before every field is filled in.
 */
export const PersonalInfoUpdateSchema = z.object({
  fullName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  website: z.string().default(""),
  profession: z.string().default(""),
  image: z.string().default(""),
});

/**
 * Full PATCH body: any scalar fields + optional relation arrays.
 * All relation fields are optional so callers can do partial updates (e.g. title-only).
 */
export const ResumeUpdateBodySchema = ResumeScalarUpdateSchema.extend({
  personalInfo: PersonalInfoUpdateSchema.nullable().optional(),
  experience: z.array(ExperienceUpdateItemSchema).optional(),
  education: z.array(EducationUpdateItemSchema).optional(),
  project: z.array(ProjectUpdateItemSchema).optional(),
});

export type ResumeUpdateBody = z.infer<typeof ResumeUpdateBodySchema>;
export type PersonalInfoUpdate = z.infer<typeof PersonalInfoUpdateSchema>;
export type ExperienceUpdateItem = z.infer<typeof ExperienceUpdateItemSchema>;
export type EducationUpdateItem = z.infer<typeof EducationUpdateItemSchema>;
export type ProjectUpdateItem = z.infer<typeof ProjectUpdateItemSchema>;
