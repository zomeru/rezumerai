import { Prisma } from "@rezumerai/database";
import Elysia from "elysia";
import { serverEnv } from "@/env";

const isProd = serverEnv?.NODE_ENV === "production";

const prismaErrorResponse = (error: Prisma.PrismaClientKnownRequestError) => {
  switch (error.code) {
    case "P2002":
      return { status: 409, message: "Resource already exists" };

    case "P2025":
      return { status: 404, message: "Resource not found" };

    case "P2003":
      return { status: 400, message: "Invalid reference" };

    default:
      return { status: 500, message: "Database error" };
  }
};

/**
 * Centralized error-handling plugin
 */
export const errorPlugin = new Elysia({ name: "plugin/error" }).onError({ as: "global" }, ({ code, error, status }) => {
  // ─────────────────────────────────────────────
  // Elysia-native errors
  // ─────────────────────────────────────────────
  switch (code) {
    case "VALIDATION":
      return status(422, "Validation error");

    case "NOT_FOUND":
      return status(404, "Not found");

    case "PARSE":
      return status(400, "Invalid request body");

    case "INVALID_COOKIE_SIGNATURE":
      return status(400, "Invalid cookie signature");
  }

  // ─────────────────────────────────────────────
  // Prisma errors
  // ─────────────────────────────────────────────
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const { status: code, message } = prismaErrorResponse(error);
    return status(code, message);
  }

  // ─────────────────────────────────────────────
  // Unknown / unhandled errors
  // ─────────────────────────────────────────────
  if (!isProd) {
    console.error(`[ERROR] ${code}`, error);
  }

  return status(500, !isProd && error instanceof Error ? error.message : "Internal server error");
});
