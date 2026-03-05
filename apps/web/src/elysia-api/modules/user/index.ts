import type { UpdateUserAccountInput } from "@rezumerai/types";
import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { UserModel } from "./model";
import { UserService } from "./service";

const userNotFound = () => status(404, "User not found");
const forbiddenUpdate = () => status(403, "You can only update your own account");
const invalidAccountUpdate = () => status(422, "At least one field must be updated");

function sanitizeAccountUpdate(body: UpdateUserAccountInput): UpdateUserAccountInput {
  const data: UpdateUserAccountInput = {};

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
  .model(UserModel)
  .get(
    "/",
    async ({ db, status }) => {
      const users = await UserService.findAll(db);
      return status(200, users);
    },
    {
      response: {
        200: "user.recordList",
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
        200: "user.account",
        404: "user.error",
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
      params: "user.byIdParams",
      response: {
        200: "user.record",
        404: "user.error",
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
      params: "user.byEmailParams",
      response: {
        200: "user.record",
        404: "user.error",
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
      body: "user.accountUpdate",
      response: {
        200: "user.account",
        403: "user.error",
        404: "user.error",
        422: "user.error",
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
      params: "user.byIdParams",
      body: "user.accountUpdate",
      response: {
        200: "user.record",
        403: "user.error",
        404: "user.error",
        422: "user.error",
      },
    },
  );
