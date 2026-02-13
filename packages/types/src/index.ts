import { z } from "zod";

/**
 * Represents a user entity in the system.
 *
 * @property id - Unique identifier for the user
 * @property name - User's display name
 * @property email - User's email address
 *
 * @example
 * ```ts
 * const user: UserType = {
 *   id: "usr_123",
 *   name: "Jane Smith",
 *   email: "jane@example.com"
 * };
 * ```
 */
export interface UserType {
  id: string;
  name: string;
  email: string;
}

/**
 * Represents a project entity with ownership information.
 *
 * @property id - Unique identifier for the project
 * @property title - Project title
 * @property description - Project description text
 * @property userId - ID of the user who owns this project
 *
 * @example
 * ```ts
 * const project: ProjectType = {
 *   id: "proj_456",
 *   title: "Software Engineer Resume",
 *   description: "Tech-focused resume for 2026 job applications",
 *   userId: "usr_123"
 * };
 * ```
 */
export interface ProjectType {
  id: string;
  title: string;
  description: string;
  userId: string;
}

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

// Zod schemas for validation
/**
 * Zod validation schema for UserType.
 * Validates user data structure with email format checking.
 *
 * @returns Zod schema that validates against UserType
 *
 * @example
 * ```ts
 * const validUser = UserSchema.parse({
 *   id: "usr_123",
 *   name: "Jane",
 *   email: "jane@example.com"
 * }); // ✓ Valid
 *
 * const invalidUser = UserSchema.parse({
 *   id: "usr_123",
 *   name: "Jane",
 *   email: "invalid-email"
 * }); // ✗ Throws ZodError
 * ```
 */
export const UserSchema: z.ZodType<UserType> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

/**
 * Zod validation schema for ProjectType.
 * Validates project data structure including ownership reference.
 *
 * @returns Zod schema that validates against ProjectType
 *
 * @example
 * ```ts
 * const validProject = ProjectSchema.parse({
 *   id: "proj_456",
 *   title: "Resume",
 *   description: "My professional resume",
 *   userId: "usr_123"
 * }); // ✓ Valid
 *
 * const invalidProject = ProjectSchema.parse({
 *   id: "proj_456",
 *   title: "", // Empty title might pass but could fail business rules
 *   userId: "usr_123"
 * }); // ✗ Missing required 'description' field
 * ```
 */
export const ProjectSchema: z.ZodType<ProjectType> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  userId: z.string(),
});

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
