import { z } from "zod";

export const ErrorLogEnvironmentSchema = z.enum(["development", "production"]);

export const ErrorLogListItemSchema = z.object({
  id: z.string(),
  errorName: z.string(),
  createdAt: z.string(),
  endpoint: z.string(),
  method: z.string(),
  functionName: z.string().nullable(),
  isRead: z.boolean(),
});

export const ErrorLogPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const ErrorLogListResponseSchema = z.object({
  items: z.array(ErrorLogListItemSchema),
  pagination: ErrorLogPaginationSchema,
});

export const ErrorLogReadByUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const ErrorLogDetailSchema = z.object({
  id: z.string(),
  errorName: z.string(),
  message: z.string(),
  stackTraceJson: z.string(),
  endpoint: z.string(),
  method: z.string(),
  functionName: z.string().nullable(),
  queryParams: z.unknown().nullable(),
  requestBody: z.unknown().nullable(),
  headers: z.unknown().nullable(),
  userId: z.string().nullable(),
  environment: ErrorLogEnvironmentSchema,
  createdAt: z.string(),
  isRead: z.boolean(),
  readAt: z.string().nullable(),
  readByUserId: z.string().nullable(),
  readByUser: ErrorLogReadByUserSchema.nullable(),
});

export type ErrorLogEnvironment = z.infer<typeof ErrorLogEnvironmentSchema>;
export type ErrorLogListItem = z.infer<typeof ErrorLogListItemSchema>;
export type ErrorLogPagination = z.infer<typeof ErrorLogPaginationSchema>;
export type ErrorLogListResponse = z.infer<typeof ErrorLogListResponseSchema>;
export type ErrorLogReadByUser = z.infer<typeof ErrorLogReadByUserSchema>;
export type ErrorLogDetail = z.infer<typeof ErrorLogDetailSchema>;
