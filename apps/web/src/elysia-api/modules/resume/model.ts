import { Resume, ResumePlainInputUpdate, ResumeRelations } from "@rezumerai/database/generated/prismabox/Resume";
import { FullResumeInputCreate } from "@rezumerai/types/index.mjs";
import Elysia, { t } from "elysia";

// ── Resume models ──────────────────────────────────────────────────────────────

export const ResumeWithoutUser = t.Omit(Resume, ["user"]);

export const CustomResumeWithRelationInputUpdate = t.Composite([
  ResumePlainInputUpdate,
  t.Omit(t.Optional(ResumeRelations), ["user"]),
]);

export const ResumeModel = new Elysia().model({
  create: FullResumeInputCreate,
  update: CustomResumeWithRelationInputUpdate,
  byId: t.Object({ id: t.String() }),
} as const);
