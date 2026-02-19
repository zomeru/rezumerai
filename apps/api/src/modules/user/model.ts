import type { UserType } from "@rezumerai/types";
import { z } from "zod";

// ── User models ──────────────────────────────────────────────────────────────

/**
 * User entity type from database.
 * Alias for shared UserType from @rezumerai/types.
 */
export type User = UserType;

/**
 * Zod validation schema for creating new users.
 * Validates POST request body for user creation endpoint.
 *
 * @property name - User's full name (required, non-empty)
 * @property email - Valid email address (required, validated format)
 *
 * @example
 * ```ts
 * const input = CreateUserSchema.parse({
 *   name: "Jane Doe",
 *   email: "jane@example.com"
 * });
 * ```
 */
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
});

/**
 * Input type for creating new users.
 * Inferred from CreateUserSchema validation.
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Zod validation schema for user route parameters.
 * Validates URL path parameters (e.g., /users/:id).
 *
 * @property id - User ID from URL path (required, non-empty)
 */
export const UserParamsSchema = z.object({
  id: z.string().min(1),
});
