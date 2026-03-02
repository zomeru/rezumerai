import { EducationPlainInputCreate } from "@rezumerai/database/generated/prismabox/Education";
import { ExperiencePlainInputCreate } from "@rezumerai/database/generated/prismabox/Experience";
import { PersonalInformationPlainInputCreate } from "@rezumerai/database/generated/prismabox/PersonalInformation";
import { ProjectPlainInputCreate } from "@rezumerai/database/generated/prismabox/Project";
import {
  Resume,
  ResumePlainInputCreate,
  ResumePlainInputUpdate,
  ResumeRelations,
} from "@rezumerai/database/generated/prismabox/Resume";
import Elysia, { t } from "elysia";

export const ResumeWithoutUser = t.Omit(Resume, ["user"]);

export const CustomResumeRelationsInputCreate = t.Object({
  personalInfo: PersonalInformationPlainInputCreate,
  education: t.Array(EducationPlainInputCreate),
  experience: t.Array(ExperiencePlainInputCreate),
  project: t.Array(ProjectPlainInputCreate),
});

export const CustomResumeInputCreate = t.Composite([
  ResumePlainInputCreate,
  t.Partial(CustomResumeRelationsInputCreate),
]);

export const CustomResumeRelationsInputUpdate = t.Partial(t.Omit(ResumeRelations, ["user"]));

export const CustomResumeWithRelationInputUpdate = t.Composite([
  ResumePlainInputUpdate,
  CustomResumeRelationsInputUpdate,
]);

export const ResumeModel = new Elysia().model({
  create: CustomResumeInputCreate,
  update: CustomResumeWithRelationInputUpdate,
  byId: t.Object({ id: t.String() }),
} as const);
