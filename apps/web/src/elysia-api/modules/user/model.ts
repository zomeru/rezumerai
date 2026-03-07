import { UserPlain, UserPlainInputUpdate } from "@rezumerai/database/generated/prismabox/User";
import Elysia, { t } from "elysia";

const UserAccountProvider = t.Object({
  providerId: t.String(),
  hasPassword: t.Boolean(),
});

const UserAccountPermissions = t.Object({
  canEditName: t.Boolean(),
  canEditEmail: t.Boolean(),
  canEditImage: t.Boolean(),
  canChangePassword: t.Boolean(),
});

const UserAccountReadOnlyReasons = t.Object({
  email: t.Nullable(t.String()),
  password: t.Nullable(t.String()),
});

const UserPasswordManagement = t.Object({
  hasCredentialProvider: t.Boolean(),
  isOAuthOnly: t.Boolean(),
  isCooldownActive: t.Boolean(),
  lastChangedAt: t.Nullable(t.String({ format: "date-time" })),
  nextAllowedAt: t.Nullable(t.String({ format: "date-time" })),
  cooldownMessage: t.Nullable(t.String()),
});

const UserCredits = t.Object({
  remaining: t.Integer({ minimum: 0 }),
  dailyLimit: t.Integer({ minimum: 1 }),
});

const UserAccountSettings = t.Object({
  user: UserPlain,
  providers: t.Array(UserAccountProvider),
  permissions: UserAccountPermissions,
  readOnlyReasons: UserAccountReadOnlyReasons,
  passwordManagement: UserPasswordManagement,
  credits: UserCredits,
});

const UserAccountUpdate = t.Pick(UserPlainInputUpdate, ["name", "email", "image"]);

export type UserAccountUpdateInput = typeof UserAccountUpdate.static;

export const UserModel = new Elysia().model({
  responseList: t.Array(UserPlain),
  responseById: UserPlain,
  responseAccount: UserAccountSettings,
  paramById: t.Object({ id: t.String({ minLength: 1 }) }),
  paramByEmail: t.Object({ email: t.String({ format: "email" }) }),
  inputUpdate: UserAccountUpdate,
  error: t.String(),
} as const);
