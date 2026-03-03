import type { EducationPlainInputUpdate } from "@rezumerai/database/generated/prismabox/Education";
import type { ExperiencePlainInputUpdate } from "@rezumerai/database/generated/prismabox/Experience";
import type { PersonalInformationPlainInputUpdate } from "@rezumerai/database/generated/prismabox/PersonalInformation";
import type { ProjectPlainInputUpdate } from "@rezumerai/database/generated/prismabox/Project";
import type { Resume, ResumePlainInputUpdate } from "@rezumerai/database/generated/prismabox/Resume";

export type ResumeWithRelations = Omit<(typeof Resume)["static"], "user">;

export type ResumeWithRelationsInputUpdate = typeof ResumePlainInputUpdate.static & {
  personalInfo?: typeof PersonalInformationPlainInputUpdate.static;
  experience?: (typeof ExperiencePlainInputUpdate.static)[];
  education?: (typeof EducationPlainInputUpdate.static)[];
  project?: (typeof ProjectPlainInputUpdate.static)[];
};
