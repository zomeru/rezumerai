import Elysia, { status, t } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { ResumeModel } from "./model";
import { ResumeService } from "./service";
import type { ResumeCreateInput, ResumeUpdateInput } from "./types";
import { validateResumeUpdate } from "./validation";

const resumeNotFound = () => status(404, "Resume not found");

/**
 * Resume module — CRUD routes for resumes.
 * Route handlers stay focused on transport concerns while the service/repository
 * layers own orchestration and Prisma access.
 */
export const resumeModule = new Elysia({ prefix: "/resumes" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(ResumeModel)
  .get(
    "/",
    async ({ db, user, query }) => {
      const data = await ResumeService.search(db, user.id, {
        search: query.search,
      });

      return status(200, data);
    },
    {
      query: "resume.QueryList",
      response: {
        200: "resume.ResponseList",
      },
    },
  )
  .post(
    "/",
    async ({ db, user, body }) => {
      const newResume = await ResumeService.create(db, user.id, body as ResumeCreateInput);

      return { success: true as const, data: newResume };
    },
    { body: "resume.InputCreate" },
  )
  .get(
    "/:id",
    async ({ db, user, params, status }) => {
      if (!params.id) {
        return resumeNotFound();
      }

      const data = await ResumeService.findById(db, user.id, params.id);

      if (!data) {
        return resumeNotFound();
      }

      return status(200, data as never);
    },
    {
      params: "resume.ParamById",
      response: {
        200: "resume.ResponseById",
        404: "resume.Error",
      },
    },
  )
  .patch(
    "/:id",
    async ({ db, user, params, body, status }) => {
      if (!params.id) {
        return resumeNotFound();
      }

      const updates = body as ResumeUpdateInput;
      const validationError = validateResumeUpdate(updates);

      if (validationError) {
        return status(422, validationError.message);
      }

      const updatedResume = await ResumeService.update(db, user.id, params.id, updates);

      if (!updatedResume) {
        return resumeNotFound();
      }

      return status(200, updatedResume as never);
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
  .delete(
    "/:id",
    async ({ db, user, params }) => {
      if (!params.id) {
        return resumeNotFound();
      }

      const deleted = await ResumeService.delete(db, user.id, params.id);

      if (!deleted) {
        return resumeNotFound();
      }

      return status(200, deleted);
    },
    {
      params: "resume.ParamById",
      response: { 404: "resume.Error", 200: t.Boolean() },
    },
  );
