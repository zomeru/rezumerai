import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { type UserAccountUpdateInput, UserModel } from "./model";
import { UserService } from "./service";

const userNotFound = () => status(404, "User not found");
const forbiddenUpdate = () => status(403, "You can only update your own account");
const invalidAccountUpdate = () => status(422, "At least one field must be updated");

function sanitizeAccountUpdate(body: UserAccountUpdateInput): UserAccountUpdateInput {
  const data: UserAccountUpdateInput = {};

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
  .prefix("model", "user.")
  .get(
    "/",
    async ({ db, status }) => {
      const users = await UserService.findAll(db);
      return status(200, users);
    },
    {
      response: {
        200: "user.ResponseList",
      },
    },
  )
  .get(
    "/me",
    async ({ db, user, status }) => {
      const accountSettings = await UserService.getAccountSettings(db, user.id);
      if (!accountSettings) return userNotFound();
      return status(200, accountSettings);
    },
    {
      response: {
        200: "user.ResponseAccount",
        404: "user.Error",
      },
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const user = await UserService.findById(db, params.id);
      if (!user) return userNotFound();
      return status(200, user);
    },
    {
      params: "user.ParamById",
      response: {
        200: "user.ResponseById",
        404: "user.Error",
      },
    },
  )
  .get(
    "/email/:email",
    async ({ db, params, status }) => {
      const user = await UserService.findByEmail(db, params.email);
      if (!user) return userNotFound();
      return status(200, user);
    },
    {
      params: "user.ParamByEmail",
      response: {
        200: "user.ResponseById",
        404: "user.Error",
      },
    },
  )
  .patch(
    "/me",
    async ({ db, user, body, status }) => {
      const accountSettings = await UserService.getAccountSettings(db, user.id);
      if (!accountSettings) return userNotFound();

      const updates = sanitizeAccountUpdate(body);
      if (Object.keys(updates).length === 0) {
        return invalidAccountUpdate();
      }

      if (updates.email && !accountSettings.permissions.canEditEmail) {
        return status(403, accountSettings.readOnlyReasons.email ?? "Email cannot be updated for this account");
      }

      const updatedUser = await UserService.update(db, user.id, updates);
      if (!updatedUser) return userNotFound();

      const refreshedAccount = await UserService.getAccountSettings(db, user.id);
      if (!refreshedAccount) return userNotFound();

      return status(200, refreshedAccount);
    },
    {
      body: "user.InputUpdate",
      response: {
        200: "user.ResponseAccount",
        403: "user.Error",
        404: "user.Error",
        422: "user.Error",
      },
    },
  )
  .patch(
    "/:id",
    async ({ db, params, user, body, status }) => {
      if (params.id !== user.id) return forbiddenUpdate();

      const accountSettings = await UserService.getAccountSettings(db, user.id);
      if (!accountSettings) return userNotFound();

      const updates = sanitizeAccountUpdate(body);
      if (Object.keys(updates).length === 0) {
        return invalidAccountUpdate();
      }

      if (updates.email && !accountSettings.permissions.canEditEmail) {
        return status(403, accountSettings.readOnlyReasons.email ?? "Email cannot be updated for this account");
      }

      const updatedUser = await UserService.update(db, params.id, updates);
      if (!updatedUser) return userNotFound();

      return status(200, updatedUser);
    },
    {
      params: "user.ParamById",
      body: "user.InputUpdate",
      response: {
        200: "user.ResponseById",
        403: "user.Error",
        404: "user.Error",
        422: "user.Error",
      },
    },
  );
