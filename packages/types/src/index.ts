import { initContract } from "@ts-rest/core";
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
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  userId: z.string(),
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// Initialize the contract
const c = initContract();

// API Contract
export const contract = c.router({
  getHealth: {
    method: "GET",
    path: "/",
    responses: {
      200: ApiResponseSchema(
        z.object({
          message: z.string(),
          timestamp: z.string(),
          server: z.string(),
        }),
      ),
    },
  },
  getUsers: {
    method: "GET",
    path: "/api/users",
    responses: {
      200: ApiResponseSchema(z.array(UserSchema)),
    },
  },
  getUser: {
    method: "GET",
    path: "/api/users/:id",
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: ApiResponseSchema(UserSchema),
      404: ApiResponseSchema(z.never()),
    },
  },
  createUser: {
    method: "POST",
    path: "/api/users",
    body: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    responses: {
      201: ApiResponseSchema(UserSchema),
      400: ApiResponseSchema(z.never()),
    },
  },
  getProjects: {
    method: "GET",
    path: "/api/projects",
    responses: {
      200: ApiResponseSchema(z.array(ProjectSchema)),
    },
  },
  getProject: {
    method: "GET",
    path: "/api/projects/:id",
    pathParams: z.object({
      id: z.string(),
    }),
    responses: {
      200: ApiResponseSchema(ProjectSchema),
      404: ApiResponseSchema(z.never()),
    },
  },
  createProject: {
    method: "POST",
    path: "/api/projects",
    body: z.object({
      title: z.string(),
      description: z.string(),
      userId: z.string(),
    }),
    responses: {
      201: ApiResponseSchema(ProjectSchema),
      400: ApiResponseSchema(z.never()),
    },
  },
});
