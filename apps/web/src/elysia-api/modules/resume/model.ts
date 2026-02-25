import { FullResumeInputCreate, ResumeUpdateBodySchema } from "@rezumerai/types/index.mjs";
import { t } from "elysia";

// ── Resume models ──────────────────────────────────────────────────────────────

/** Model group for Elysia `.model()` registration — reference schemas by name in route validation. */
export const ResumeModels = {
  "resume.create": FullResumeInputCreate,
  "resume.update": ResumeUpdateBodySchema,
  "resume.byIdParams": t.Object({ id: t.String() }),
} as const;
