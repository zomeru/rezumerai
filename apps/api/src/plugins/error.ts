import { Prisma } from "@rezumerai/database";
import Elysia from "elysia";
import { env } from "../env";

/**
 * Error-handling plugin — provides centralized, consistent error responses.
 */
export const errorPlugin = new Elysia({ name: "plugin/error" }).onError({ as: "global" }, ({ code, error, status }) => {
  switch (code) {
    case "VALIDATION":
      return status(422, {
        success: false,
        error: "Validation error",
        details: error.all,
      });

    case "NOT_FOUND":
      return status(404, {
        success: false,
        error: "Not found",
      });

    case "PARSE":
      return status(400, {
        success: false,
        error: "Invalid request body",
      });

    case "INVALID_COOKIE_SIGNATURE":
      return status(400, {
        success: false,
        error: "Invalid cookie signature",
      });

    default: {
      // Map Prisma "record not found" (P2025) to 404
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return status(404, {
          success: false,
          error: "Resource not found",
        });
      }

      const isProd = env.NODE_ENV === "production";
      console.error(`[ERROR] ${code}:`, error);

      return status(500, {
        success: false,
        error: isProd ? "Internal server error" : error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
});
