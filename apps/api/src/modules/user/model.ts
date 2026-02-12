import { z } from "zod";

// ── User models ──────────────────────────────────────────────────────────────

/**
 * Zod validation schema for user entity from database.
 * Validates complete user data returned from queries.
 *
 * @property id - Unique user identifier
 * @property name - User's full name
 * @property email - User's email address (validated format)
 */
// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

/**
 * User entity type from database.
 * Represents a complete user record with all fields.
 */
export type User = z.infer<typeof UserSchema>;

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
// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
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
// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const UserParamsSchema = z.object({
  id: z.string().min(1),
});
