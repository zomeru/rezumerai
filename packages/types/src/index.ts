import { z } from "zod";

export type StringType = string;

export type UserType = {
  id: string;
  name: string;
  email: string;
};

export type ProjectType = {
  id: string;
  title: string;
  description: string;
  userId: string;
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Zod schemas for validation
export const UserSchema: z.ZodType<UserType> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const ProjectSchema: z.ZodType<ProjectType> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  userId: z.string(),
});

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
