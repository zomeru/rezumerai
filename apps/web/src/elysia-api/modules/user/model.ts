import { UserPlain, UserPlainInputCreate, UserPlainInputUpdate } from "@rezumerai/database/generated/prismabox/User";
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

export type UserAccountUpdateInput = {
  name?: string;
  email?: string;
  image?: string | null;
};

const UserAccountUpdate = t.Pick(UserPlainInputUpdate, ["name", "email", "image"]);
const UserAdminCreate = t.Pick(UserPlainInputCreate, ["name", "email", "role", "image", "isAnonymous"]);
const UserAdminUpdate = t.Pick(UserPlainInputUpdate, ["name", "email", "role", "image", "isAnonymous"]);

export const UserModel = new Elysia().model({
  "user.ResponseList": t.Array(UserPlain),
  "user.ResponseById": UserPlain,
  "user.ResponseAccount": UserAccountSettings,
  "user.ParamById": t.Object({ id: t.String({ minLength: 1 }) }),
  "user.ParamByEmail": t.Object({ email: t.String({ format: "email" }) }),
  "user.InputUpdate": UserAccountUpdate,
  "user.AdminCreateInput": UserAdminCreate,
  "user.AdminUpdateInput": UserAdminUpdate,
  "user.Error": t.String(),
} as const);
