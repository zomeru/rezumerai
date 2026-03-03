import type { EducationPlainInputUpdate } from "@rezumerai/database/generated/prismabox/Education";
import type { ExperiencePlainInputUpdate } from "@rezumerai/database/generated/prismabox/Experience";
import type { PersonalInformationPlainInputUpdate } from "@rezumerai/database/generated/prismabox/PersonalInformation";
import type { ProjectPlainInputUpdate } from "@rezumerai/database/generated/prismabox/Project";
import type { Resume, ResumePlainInputUpdate } from "@rezumerai/database/generated/prismabox/Resume";
import { z } from "zod";

export type ResumeWithRelations = Omit<(typeof Resume)["static"], "user">;

export type ResumeWithRelationsInputUpdate = typeof ResumePlainInputUpdate.static & {
  personalInfo?: typeof PersonalInformationPlainInputUpdate.static;
  experience?: (typeof ExperiencePlainInputUpdate.static)[];
  education?: (typeof EducationPlainInputUpdate.static)[];
  project?: (typeof ProjectPlainInputUpdate.static)[];
};

export const ExperienceItemSchema = z
  .object({
    id: z.string(),
    resumeId: z.string(),
    company: z.string(),
    position: z.string(),
    description: z.string(),
    isCurrent: z.boolean(),
    startDate: z.date(),
    endDate: z.date().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.isCurrent && data.endDate === null) {
      ctx.addIssue({
        code: "custom",
        message: "End date is required",
        path: ["endDate"],
      });
    }
  });

export const ExperienceArraySchema = z.array(ExperienceItemSchema);
