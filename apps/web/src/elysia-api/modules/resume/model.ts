import { EducationPlain, EducationPlainInputCreate } from "@rezumerai/database/generated/prismabox/Education";
import { ExperiencePlain, ExperiencePlainInputCreate } from "@rezumerai/database/generated/prismabox/Experience";
import {
  PersonalInformationPlain,
  PersonalInformationPlainInputCreate,
} from "@rezumerai/database/generated/prismabox/PersonalInformation";
import { ProjectPlain, ProjectPlainInputCreate } from "@rezumerai/database/generated/prismabox/Project";
import { Resume, ResumePlain, ResumePlainInputCreate } from "@rezumerai/database/generated/prismabox/Resume";
import type { ResumeWithRelations } from "@rezumerai/types";
import Elysia, { t } from "elysia";

export type ResumeCreateInput = Omit<
  ResumeWithRelations,
  "id" | "userId" | "createdAt" | "updatedAt" | "personalInfo" | "experience" | "education" | "project"
> & {
  personalInfo?: Omit<NonNullable<ResumeWithRelations["personalInfo"]>, "id" | "resumeId">;
  experience: Array<Omit<ResumeWithRelations["experience"][number], "resumeId">>;
  education: Array<Omit<ResumeWithRelations["education"][number], "resumeId">>;
  project: Array<Omit<ResumeWithRelations["project"][number], "resumeId">>;
};

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
  "resume.ResponseList": t.Array(ResumeWithoutUser),
  "resume.ResponseById": ResumeWithoutUser,
  "resume.QueryList": t.Object({
    search: t.Optional(t.String()),
  }),
  "resume.InputCreate": CustomResumeWithRelationsInputCreate,
  "resume.InputUpdate": CustomResumeWithRelationsInputUpdate,
  "resume.ParamById": t.Object({ id: t.String() }),
  "resume.Error": t.String(),
} as const);
