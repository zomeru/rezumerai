import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { UserModels } from "./model";
import { UserService } from "./service";

const userNotFound = () => status(404, { success: false, error: "User not found" });

/**
 * User module — CRUD routes for users.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const userModule = new Elysia({ prefix: "/users" })
  .use(prismaPlugin)
  .use(authPlugin)
  .model(UserModels)
  .get("/", async ({ db }) => {
    const users = await UserService.findAll(db);
    return { success: true as const, data: users };
  })
  .get(
    "/:id",
    async ({ db, params }) => {
      const user = await UserService.findById(db, params.id);
      if (!user) return userNotFound();
      return { success: true as const, data: user };
    },
    { params: "user.byIdParams" },
  )
  .get(
    "/email/:email",
    async ({ db, params }) => {
      const user = await UserService.findByEmail(db, params.email);
      if (!user) return userNotFound();
      return { success: true as const, data: user };
    },
    { params: "user.byEmailParams" },
  )
  .patch(
    "/:id",
    async ({ db, params, body }) => {
      const updatedUser = await UserService.update(db, params.id, body);
      if (!updatedUser) return userNotFound();
      return { success: true as const, data: updatedUser };
    },
    {
      params: "user.byIdParams",
      body: "user.update",
    },
  );
