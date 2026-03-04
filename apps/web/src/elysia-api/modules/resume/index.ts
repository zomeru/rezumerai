import Elysia, { status, t } from "elysia";
import { ERROR_MESSAGES } from "@/constants/errors";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { ResumeModel, ResumeWithoutUser } from "./model";
import { ResumeService } from "./service";

const resumeNotFound = () => status(404, "Resume not found");

/**
 * Resume module — CRUD routes for resumes.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const resumeModule = new Elysia({ prefix: "/resumes" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(ResumeModel)
  .prefix("model", "resume.")
  // ── GET /resumes ───────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ db, user, query }) => {
      const resumes = await ResumeService.search(db, user.id, {
        search: query.search,
      });

      return status(200, resumes);
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
      }),
      response: {
        200: t.Array(ResumeWithoutUser),
      },
    },
  )
  // ── POST /resumes ──────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ db, user, body }) => {
      const newResume = await ResumeService.create(db, user.id, body);
      return { success: true as const, data: newResume };
    },
    { body: "resume.Create" },
  )
  // ── GET /resumes/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ db, user, params, status }) => {
      const resume = await ResumeService.findById(db, user.id, params.id);

      if (!resume) {
        return resumeNotFound();
      }

      return status(200, resume);
    },
    {
      params: "resume.ById",
      response: {
        200: ResumeWithoutUser,
        404: t.String(),
      },
    },
  )
  // ── PATCH /resumes/:id ─────────────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ db, user, params, body, status }) => {
      const { experience } = body as {
        experience?: Array<{
          isCurrent?: boolean | null;
          endDate?: Date | null;
        }>;
      };
      const hasInvalidExp = experience?.some((exp) => exp.isCurrent === false && !exp.endDate);
      if (hasInvalidExp) {
        return status(422, ERROR_MESSAGES.NON_CURRENT_POSITION_END_DATE);
      }

      const updatedResume = await ResumeService.update(
        db,
        user.id,
        params.id,
        body as Parameters<typeof ResumeService.update>[3],
      );
      if (!updatedResume) return resumeNotFound();
      return status(200, updatedResume);
    },
    {
      params: "resume.ById",
      response: {
        200: ResumeWithoutUser,
        404: t.String(),
        422: t.String(),
      },
    },
  )
  // ── DELETE /resumes/:id ────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ db, user, params }) => {
      const deleted = await ResumeService.delete(db, user.id, params.id);
      if (!deleted) return resumeNotFound();
      return status(200, deleted);
    },
    {
      params: "resume.ById",
      response: { 404: t.String(), 200: t.Boolean() },
    },
  );
