import { EducationPlain, EducationPlainInputCreate } from "@rezumerai/database/generated/prismabox/Education";
import { ExperiencePlain, ExperiencePlainInputCreate } from "@rezumerai/database/generated/prismabox/Experience";
import {
  PersonalInformationPlain,
  PersonalInformationPlainInputCreate,
} from "@rezumerai/database/generated/prismabox/PersonalInformation";
import { ProjectPlain, ProjectPlainInputCreate } from "@rezumerai/database/generated/prismabox/Project";
import { Resume, ResumePlain, ResumePlainInputCreate } from "@rezumerai/database/generated/prismabox/Resume";
import Elysia, { t } from "elysia";

export const ResumeWithoutUser = t.Omit(Resume, ["user"]);

export const CustomResumeRelationsInputCreate = t.Object({
  personalInfo: PersonalInformationPlainInputCreate,
  education: t.Array(EducationPlainInputCreate),
  experience: t.Array(ExperiencePlainInputCreate),
  project: t.Array(ProjectPlainInputCreate),
});

export const CustomResumeRelationsInputUpdate = t.Object({
  personalInfo: t.Optional(t.Partial(PersonalInformationPlain)),
  education: t.Optional(t.Array(t.Partial(EducationPlain))),
  experience: t.Optional(t.Array(t.Partial(ExperiencePlain))),
  project: t.Optional(t.Array(t.Partial(ProjectPlain))),
});

export const CustomResumeWithRelationsInputCreate = t.Composite([
  ResumePlainInputCreate,
  t.Partial(CustomResumeRelationsInputCreate),
]);

export const CustomResumeWithRelationsInputUpdate = t.Composite([
  t.Partial(ResumePlain),
  CustomResumeRelationsInputUpdate,
]);

export const ResumeModel = new Elysia().model({
  responseList: t.Array(ResumeWithoutUser),
  responseById: ResumeWithoutUser,
  queryList: t.Object({
    search: t.Optional(t.String()),
  }),
  inputCreate: CustomResumeWithRelationsInputCreate,
  inputUpdate: CustomResumeWithRelationsInputUpdate,
  paramById: t.Object({ id: t.String() }),
  error: t.String(),
} as const);
