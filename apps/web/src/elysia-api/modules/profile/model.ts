import { UserPlain, UserPlainInputUpdate } from "@rezumerai/database/generated/prismabox/User";
import Elysia, { t } from "elysia";

const ProfileAccountProvider = t.Object({
  providerId: t.String(),
  hasPassword: t.Boolean(),
});

const ProfileAccountPermissions = t.Object({
  canEditName: t.Boolean(),
  canEditEmail: t.Boolean(),
  canEditImage: t.Boolean(),
  canChangePassword: t.Boolean(),
});

const ProfileAccountReadOnlyReasons = t.Object({
  email: t.Nullable(t.String()),
  password: t.Nullable(t.String()),
});

const ProfilePasswordManagement = t.Object({
  hasCredentialProvider: t.Boolean(),
  isOAuthOnly: t.Boolean(),
  isCooldownActive: t.Boolean(),
  lastChangedAt: t.Nullable(t.String({ format: "date-time" })),
  nextAllowedAt: t.Nullable(t.String({ format: "date-time" })),
  cooldownMessage: t.Nullable(t.String()),
});

const ProfileCredits = t.Object({
  remaining: t.Integer({ minimum: 0 }),
  dailyLimit: t.Integer({ minimum: 1 }),
});

const ProfileAccountSettings = t.Object({
  user: UserPlain,
  providers: t.Array(ProfileAccountProvider),
  permissions: ProfileAccountPermissions,
  readOnlyReasons: ProfileAccountReadOnlyReasons,
  passwordManagement: ProfilePasswordManagement,
  credits: ProfileCredits,
});

const ProfileUpdateInput = t.Pick(UserPlainInputUpdate, ["name", "email", "image"]);

export type ProfileUpdateInput = {
  name?: string;
  email?: string;
  image?: string | null;
};

export const ProfileModel = new Elysia().model({
  "profile.Response": ProfileAccountSettings,
  "profile.InputUpdate": ProfileUpdateInput,
  "profile.Error": t.String(),
} as const);
