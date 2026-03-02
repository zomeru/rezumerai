import type { EducationPlainInputUpdate } from "@rezumerai/database/generated/prismabox/Education";
import type { ExperiencePlainInputUpdate } from "@rezumerai/database/generated/prismabox/Experience";
import type { PersonalInformationPlainInputUpdate } from "@rezumerai/database/generated/prismabox/PersonalInformation";
import type { ProjectPlainInputUpdate } from "@rezumerai/database/generated/prismabox/Project";
import type { Resume, ResumePlainInputUpdate } from "@rezumerai/database/generated/prismabox/Resume";
import { z } from "zod";

/* ---------------------------------- */
/* Enums                              */
/* ---------------------------------- */

export const TEMPLATE_VALUES = ["classic", "modern", "minimal", "minimal_image"] as const;

export const FONT_SIZE_VALUES = ["small", "medium", "large", "custom"] as const;

export const TemplateEnum = z.enum(TEMPLATE_VALUES);
export const FontSizeEnum = z.enum(FONT_SIZE_VALUES);

export type ResumeWithRelations = Omit<(typeof Resume)["static"], "user">;

export type ResumeWithRelationsInputUpdate = typeof ResumePlainInputUpdate.static & {
  personalInfo?: typeof PersonalInformationPlainInputUpdate.static;
  experience?: (typeof ExperiencePlainInputUpdate.static)[];
  education?: (typeof EducationPlainInputUpdate.static)[];
  project?: (typeof ProjectPlainInputUpdate.static)[];
};
