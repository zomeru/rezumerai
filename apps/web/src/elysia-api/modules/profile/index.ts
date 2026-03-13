import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { ProfileModel, type ProfileUpdateInput } from "./model";
import { ProfileService } from "./service";

const profileNotFound = () => status(404, "User profile not found");
const invalidProfileUpdate = () => status(422, "At least one profile field must be updated");

function sanitizeProfileUpdate(body: ProfileUpdateInput): ProfileUpdateInput {
  const data: ProfileUpdateInput = {};

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

export const profileModule = new Elysia({ prefix: "/profile" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(ProfileModel)
  .get(
    "/",
    async ({ db, user, status }) => {
      const accountSettings = await ProfileService.getAccountSettings(db, user.id);
      if (!accountSettings) return profileNotFound();

      return status(200, accountSettings);
    },
    {
      response: {
        200: "profile.Response",
        404: "profile.Error",
      },
    },
  )
  .patch(
    "/",
    async ({ db, user, body, status }) => {
      const accountSettings = await ProfileService.getAccountSettings(db, user.id);
      if (!accountSettings) return profileNotFound();

      const updates = sanitizeProfileUpdate(body as ProfileUpdateInput);
      if (Object.keys(updates).length === 0) {
        return invalidProfileUpdate();
      }

      if (updates.email && !accountSettings.permissions.canEditEmail) {
        return status(403, accountSettings.readOnlyReasons.email ?? "Email cannot be updated for this account");
      }

      const updated = await ProfileService.updateOwnProfile(db, user.id, updates);
      if (!updated) return profileNotFound();

      const refreshed = await ProfileService.getAccountSettings(db, user.id);
      if (!refreshed) return profileNotFound();

      return status(200, refreshed);
    },
    {
      body: "profile.InputUpdate",
      response: {
        200: "profile.Response",
        403: "profile.Error",
        404: "profile.Error",
        422: "profile.Error",
      },
    },
  );
