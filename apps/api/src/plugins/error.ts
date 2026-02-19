import Elysia from "elysia";

/**
 * Error-handling plugin — provides centralized, consistent error responses.
 */
export const errorPlugin = new Elysia({ name: "plugin/error" }).onError({ as: "global" }, ({ code, error, set }) => {
  switch (code) {
    case "VALIDATION": {
      set.status = 422;
      return {
        success: false,
        error: "Validation error",
        details: error.all,
      };
    }
    case "NOT_FOUND": {
      set.status = 404;
      return {
        success: false,
        error: "Not found",
      };
    }
    case "PARSE": {
      set.status = 400;
      return {
        success: false,
        error: "Invalid request body",
      };
    }
    default: {
      const status = (set.status as number) ?? 500;
      set.status = status >= 400 ? status : 500;

      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      console.error(`[ERROR] ${code}:`, error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
});
