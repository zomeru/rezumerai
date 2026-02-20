import Elysia from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { CreateUserSchema, UserParamsSchema } from "./model";
import { UserService } from "./service";

/**
 * User module — CRUD routes for users.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const userModule = new Elysia({ prefix: "/users" })
  .use(prismaPlugin)
  .use(authPlugin)
  .get("/", async ({ db }) => {
    const service = new UserService(db);
    const users = await service.findAll();

    return { success: true, data: users };
  })
  .get(
    "/:id",
    async ({ db, params, set }) => {
      const service = new UserService(db);
      const user = await service.findById(params.id);

      if (!user) {
        set.status = 404;
        return { success: false, error: "User not found" };
      }

      return { success: true, data: user };
    },
    { params: UserParamsSchema },
  )
  .post(
    "/",
    async ({ db, body }) => {
      const service = new UserService(db);
      const user = await service.create(body);

      return { success: true, data: user };
    },
    { body: CreateUserSchema },
  );
