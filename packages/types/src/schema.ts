import { z } from "zod";

/**
 * Standardized API response wrapper for all endpoints.
 * Provides consistent structure for success/error handling across the application.
 *
 * @template T - Type of the response data payload
 * @property success - Indicates whether the API call succeeded
 * @property data - Optional payload data (present on success)
 * @property error - Optional error message (present on failure)
 *
 * @example
 * ```ts
 * // Success response
 * const response: ApiResponse<UserType> = {
 *   success: true,
 *   data: { id: "usr_123", name: "John", email: "john@example.com" }
 * };
 *
 * // Error response
 * const errorResponse: ApiResponse = {
 *   success: false,
 *   error: "User not found"
 * };
 * ```
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Factory function that creates a Zod schema for ApiResponse with typed data payload.
 * Wraps any Zod schema in the standardized ApiResponse structure.
 *
 * @template T - Zod schema type for the data payload
 * @param dataSchema - Zod schema to validate the response data field
 * @returns Zod schema that validates an ApiResponse containing the specified data type
 *
 * @example
 * ```ts
 * // Create schema for API response containing UserType
 * const UserResponseSchema = ApiResponseSchema(UserSchema);
 *
 * const response = UserResponseSchema.parse({
 *   success: true,
 *   data: { id: "usr_123", name: "John", email: "john@example.com" }
 * }); // ✓ Valid
 *
 * // Works with any Zod schema
 * const StringResponseSchema = ApiResponseSchema(z.string());
 * const result = StringResponseSchema.parse({
 *   success: true,
 *   data: "Hello, world!"
 * }); // ✓ Valid
 * ```
 */
export const ApiResponseSchema: <
  T extends z.ZodType<{
    success: boolean;
    data?: unknown;
    error?: string;
  }>,
>(
  dataSchema: T,
) => z.ZodType<ApiResponse<z.infer<T>>> = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });
