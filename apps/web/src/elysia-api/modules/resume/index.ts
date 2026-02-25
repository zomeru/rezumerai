import Elysia from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { ResumeModels } from "./model";
import { ResumeService } from "./service";

/**
 * Resume module — CRUD routes for resumes
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const resumeModule = new Elysia({ prefix: "/resumes" })
  .use(prismaPlugin)
  .use(authPlugin)
  .model(ResumeModels)
  .get("/", async ({ db, user }) => {
    const resumes = await ResumeService.findAll(db, user.id);
    return { success: true as const, data: resumes };
  })
  .post(
    "/",
    async ({ db, user, body }) => {
      const newResume = await ResumeService.create(db, user.id, body);
      return { success: true as const, data: newResume };
    },
    {
      body: "resume.create",
    },
  );
