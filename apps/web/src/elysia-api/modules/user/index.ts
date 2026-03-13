import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { UserModel } from "./model";
import { UserService } from "./service";

const userNotFound = () => status(404, "User not found");
const adminForbidden = () => status(403, "Admin access is required");
const invalidAccountUpdate = () => status(422, "At least one field must be updated");

function sanitizeAdminCreate(body: {
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  image?: string | null;
  isAnonymous?: boolean;
}): {
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  image: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
} {
  return {
    name: body.name?.trim() ?? "",
    email: body.email?.trim().toLowerCase() ?? "",
    role: body.role ?? "USER",
    image: body.image?.trim() || null,
    isAnonymous: body.isAnonymous ?? false,
    emailVerified: false,
  };
}

function sanitizeAdminUpdate(body: {
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  image?: string | null;
  isAnonymous?: boolean;
}): {
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  image?: string | null;
  isAnonymous?: boolean;
} {
  const data: {
    name?: string;
    email?: string;
    role?: "ADMIN" | "USER";
    image?: string | null;
    isAnonymous?: boolean;
  } = {};

  if (body.name !== undefined) {
    data.name = body.name.trim();
  }

  if (body.email !== undefined) {
    data.email = body.email.trim().toLowerCase();
  }

  if (body.image !== undefined) {
    data.image = body.image?.trim() || null;
  }

  return data;
}

/**
 * User module — CRUD routes for users.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const userModule = new Elysia({ prefix: "/users" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(UserModel)
  .derive(({ user, set }) => {
    const role = typeof user?.role === "string" ? user.role : null;

    if (role !== "ADMIN") {
      set.status = 403;
      return { __forbidden: true as const };
    }

    return { __forbidden: false as const };
  })
  .onBeforeHandle(({ __forbidden }) => {
    if (__forbidden) return adminForbidden();
  })
  .post(
    "/",
    async ({ db, body, status }) => {
      const created = await UserService.create(db, sanitizeAdminCreate(body));
      return status(201, created);
    },
    {
      body: "user.AdminCreateInput",
      response: {
        201: "user.ResponseById",
        403: "user.Error",
      },
    },
  )
  .get(
    "/",
    async ({ db, status }) => {
      const users = await UserService.findAll(db);
      return status(200, users);
    },
    {
      response: {
        200: "user.ResponseList",
        403: "user.Error",
      },
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      if (!params.id) {
        return userNotFound();
      }

      const user = await UserService.findById(db, params.id);
      if (!user) return userNotFound();
      return status(200, user);
    },
    {
      params: "user.ParamById",
      response: {
        200: "user.ResponseById",
        403: "user.Error",
        404: "user.Error",
      },
    },
  )
  .get(
    "/email/:email",
    async ({ db, params, status }) => {
      if (!params.email) {
        return userNotFound();
      }

      const user = await UserService.findByEmail(db, params.email);
      if (!user) return userNotFound();
      return status(200, user);
    },
    {
      params: "user.ParamByEmail",
      response: {
        200: "user.ResponseById",
        403: "user.Error",
        404: "user.Error",
      },
    },
  )
  .patch(
    "/:id",
    async ({ db, params, body, status }) => {
      const updates = sanitizeAdminUpdate(body);
      if (Object.keys(updates).length === 0) {
        return invalidAccountUpdate();
      }

      const updatedUser = await UserService.update(db, params.id, updates);
      if (!updatedUser) return userNotFound();

      return status(200, updatedUser);
    },
    {
      params: "user.ParamById",
      body: "user.AdminUpdateInput",
      response: {
        200: "user.ResponseById",
        403: "user.Error",
        404: "user.Error",
        422: "user.Error",
      },
    },
  )
  .delete(
    "/:id",
    async ({ db, params, status }) => {
      const deletedUser = await UserService.remove(db, params.id);
      if (!deletedUser) return userNotFound();

      return status(200, deletedUser);
    },
    {
      params: "user.ParamById",
      response: {
        200: "user.ResponseById",
        403: "user.Error",
        404: "user.Error",
      },
    },
  );
