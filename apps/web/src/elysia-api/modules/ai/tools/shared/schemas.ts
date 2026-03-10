import { z } from "zod";

export const limitSchema = z.object({
  limit: z.number().int().min(1).max(10).default(5),
});

export const searchSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export const userIdSchema = z.object({
  userId: z.string().trim().min(1),
});

export const resumeIdSchema = z.object({
  resumeId: z.string().trim().min(1),
});
