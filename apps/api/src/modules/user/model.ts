import { GetUserByEmailParamsSchema, GetUserByIdParamsSchema, UserSchema } from "@rezumerai/types";
import type { z } from "zod";

// ── User models ──────────────────────────────────────────────────────────────

export type UserRecord = z.infer<typeof UserSchema>;

/** Model group for Elysia `.model()` registration — reference schemas by name in route validation. */
export const UserModels = {
  "user.byIdParams": GetUserByIdParamsSchema,
  "user.byEmailParams": GetUserByEmailParamsSchema,
  "user.record": UserSchema,
  "user.update": UserSchema.partial(),
} as const;
