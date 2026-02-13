import { z } from "zod";

// ── Auth models ──────────────────────────────────────────────────────────────

/**
 * Zod validation schema for authenticated session user data.
 * Validates user information from NextAuth session.
 *
 * @property id - Unique user identifier
 * @property email - User email address (validated format)
 * @property name - User display name (nullable)
 */
// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
});

/**
 * Authenticated session user type.
 * Represents user data extracted from validated NextAuth session.
 *
 * @example
 * ```ts
 * const user: SessionUser = {
 *   id: "user_123",
 *   email: "user@example.com",
 *   name: "John Doe"
 * };
 * ```
 */
export type SessionUser = z.infer<typeof SessionUserSchema>;

/**
 * Zod validation schema for authentication API responses.
 * Standardized response format for auth endpoints (/api/auth/*).
 *
 * @property success - Whether the authentication request succeeded
 * @property data - Authenticated user data (present on success)
 * @property error - Error message (present on failure)
 *
 * @example
 * ```ts
 * // Success response
 * const response = AuthResponseSchema.parse({
 *   success: true,
 *   data: { id: "user_123", email: "user@example.com", name: "John" }
 * });
 *
 * // Error response
 * const errorResponse = AuthResponseSchema.parse({
 *   success: false,
 *   error: "Invalid session"
 * });
 * ```
 */
// biome-ignore lint/nursery/useExplicitType: Zod type inference required
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: SessionUserSchema.optional(),
  error: z.string().optional(),
});
