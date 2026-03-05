import type { ResumeWithRelations } from "@rezumerai/types";
import Elysia, { status, t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { redisCache, redisPlugin } from "../../plugins/redis";
import { ResumeModel } from "./model";
import { ResumeService } from "./service";
import { validateResumeUpdate } from "./utils";

const CACHE_TTL_SECONDS = 300;

const resumeNotFound = () => status(404, "Resume not found");

/**
 * Resume module — CRUD routes for resumes.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const resumeModule = new Elysia({ prefix: "/resumes" })
  .use(prismaPlugin)
  .use(redisPlugin)
  .use(authPlugin)
  .use(ResumeModel)
  .prefix("model", "resume.")
  // ── GET /resumes ───────────────────────────────────────────────────────────
  .get(
    "/",
    async ({ db, user, query, redis }) => {
      const cacheKey = `resumes:${user.id}:${query.search ?? "all"}`;

      const data = await redisCache<ResumeWithRelations[]>(
        redis,
        cacheKey,
        () => ResumeService.search(db, user.id, { search: query.search }),
        CACHE_TTL_SECONDS,
      );

      return status(200, data);
    },
    {
      query: "resume.QueryList",
      response: {
        200: "resume.ResponseList",
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
    { body: "resume.InputCreate" },
  )
  // ── GET /resumes/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ db, user, params, status, redis }) => {
      const cacheKey = `resume:${user.id}:${params.id}`;

      const data = await redisCache<ResumeWithRelations | null>(
        redis,
        cacheKey,
        () => ResumeService.findById(db, user.id, params.id),
        CACHE_TTL_SECONDS,
      );

      if (!data) {
        return resumeNotFound();
      }

      return status(200, data);
    },
    {
      params: "resume.ParamById",
      response: {
        200: "resume.ResponseById",
        404: "resume.Error",
      },
    },
  )
  // ── PATCH /resumes/:id ─────────────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ db, user, params, body, status }) => {
      const validationError = validateResumeUpdate(body);
      if (validationError) {
        return status(422, validationError.message);
      }

      const updatedResume = await ResumeService.update(db, user.id, params.id, body);
      if (!updatedResume) return resumeNotFound();
      return status(200, updatedResume);
    },
    {
      params: "resume.ParamById",
      body: "resume.InputUpdate",
      response: {
        200: "resume.ResponseById",
        404: "resume.Error",
        422: "resume.Error",
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
      params: "resume.ParamById",
      response: { 404: "resume.Error", 200: t.Boolean() },
    },
  );
