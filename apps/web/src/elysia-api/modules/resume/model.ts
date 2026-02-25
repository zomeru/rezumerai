import { FullResumeInputCreate } from "@rezumerai/types/index.mjs";

// ── Rusme models ──────────────────────────────────────────────────────────────

/** Model group for Elysia `.model()` registration — reference schemas by name in route validation. */
export const ResumeModels = {
  "resume.create": FullResumeInputCreate,
} as const;
