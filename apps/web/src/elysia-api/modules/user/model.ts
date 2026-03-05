import {
  GetUserByEmailParamsSchema,
  GetUserByIdParamsSchema,
  UpdateUserAccountSchema,
  UserAccountSettingsSchema,
  UserSchema,
} from "@rezumerai/types";
import { z } from "zod";

// ── User models ──────────────────────────────────────────────────────────────

export type UserRecord = z.infer<typeof UserSchema>;

/** Model group for Elysia `.model()` registration — reference schemas by name in route validation. */
export const UserModel = {
  "user.byIdParams": GetUserByIdParamsSchema,
  "user.byEmailParams": GetUserByEmailParamsSchema,
  "user.error": z.string(),
  "user.record": UserSchema,
  "user.recordList": z.array(UserSchema),
  "user.update": UserSchema.partial(),
  "user.account": UserAccountSettingsSchema,
  "user.accountUpdate": UpdateUserAccountSchema,
} as const;
