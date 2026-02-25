import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { ResumeModels } from "./model";
import { ResumeService } from "./service";

const resumeNotFound = () => status(404, { success: false as const, error: "Resume not found" });

/**
 * Resume module — CRUD routes for resumes.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const resumeModule = new Elysia({ prefix: "/resumes" })
  .use(prismaPlugin)
  .use(authPlugin)
  .model(ResumeModels)
  // ── GET /resumes ───────────────────────────────────────────────────────────
  .get("/", async ({ db, user }) => {
    const resumes = await ResumeService.findAll(db, user.id);
    return { success: true as const, data: resumes };
  })
  // ── POST /resumes ──────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ db, user, body }) => {
      const newResume = await ResumeService.create(db, user.id, body);
      return { success: true as const, data: newResume };
    },
    { body: "resume.create" },
  )
  // ── GET /resumes/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ db, user, params }) => {
      const resume = await ResumeService.findById(db, user.id, params.id);
      if (!resume) return resumeNotFound();
      return { success: true as const, data: resume };
    },
    { params: "resume.byIdParams" },
  )
  // ── PATCH /resumes/:id ─────────────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ db, user, params, body }) => {
      const updated = await ResumeService.update(db, user.id, params.id, body);
      if (!updated) return resumeNotFound();
      return { success: true as const, data: updated };
    },
    {
      params: "resume.byIdParams",
      body: "resume.update",
    },
  )
  // ── DELETE /resumes/:id ────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ db, user, params }) => {
      const deleted = await ResumeService.deleteResume(db, user.id, params.id);
      if (!deleted) return resumeNotFound();
      return { success: true as const, data: { id: params.id } };
    },
    { params: "resume.byIdParams" },
  );
