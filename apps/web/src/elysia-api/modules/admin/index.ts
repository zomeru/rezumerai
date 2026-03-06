import Elysia from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { AdminErrorModel, type ErrorLogListQueryInput } from "./model";
import { ErrorLogService } from "./service";

const ADMIN_FORBIDDEN_MESSAGE = "Admin access is required";
const ERROR_LOG_NOT_FOUND_MESSAGE = "Error log not found";

function parseListQuery(query: ErrorLogListQueryInput): {
  page: number | undefined;
  pageSize: number | undefined;
  isRead: boolean | undefined;
} {
  const page = query.page ? Number(query.page) : undefined;
  const pageSize = query.pageSize ? Number(query.pageSize) : undefined;

  let isRead: boolean | undefined;

  if (query.isRead === "true") {
    isRead = true;
  }

  if (query.isRead === "false") {
    isRead = false;
  }

  return {
    page,
    pageSize,
    isRead,
  };
}

export const adminModule = new Elysia({ name: "module/admin", prefix: "/admin" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(AdminErrorModel)
  .derive({ as: "scoped" }, async ({ db, user, set }) => {
    const userId = typeof user?.id === "string" ? user.id : null;

    if (!userId) {
      set.status = 403;
      return {
        __forbidden: true as const,
      };
    }

    const isAdmin = await ErrorLogService.isAdmin(db, userId);

    if (!isAdmin) {
      set.status = 403;
      return {
        __forbidden: true as const,
      };
    }

    return {
      __forbidden: false as const,
    };
  })
  .onBeforeHandle({ as: "scoped" }, ({ __forbidden, status }) => {
    if (__forbidden) {
      return status(403, ADMIN_FORBIDDEN_MESSAGE);
    }
  })
  .get(
    "/errors",
    async ({ db, query, status }) => {
      const result = await ErrorLogService.listErrorLogs(db, parseListQuery(query));

      return status(200, result);
    },
    {
      query: "adminError.QueryList",
      response: {
        200: "adminError.ListResponse",
        403: "adminError.Error",
      },
      detail: {
        summary: "List tracked application errors",
        tags: ["Admin", "Errors"],
      },
    },
  )
  .get(
    "/errors/:id",
    async ({ db, params, status }) => {
      const errorLog = await ErrorLogService.getErrorLogById(db, params.id);

      if (!errorLog) {
        return status(404, ERROR_LOG_NOT_FOUND_MESSAGE);
      }

      return status(200, errorLog);
    },
    {
      params: "adminError.ParamById",
      response: {
        200: "adminError.DetailResponse",
        403: "adminError.Error",
        404: "adminError.Error",
      },
      detail: {
        summary: "Get detailed error log entry",
        tags: ["Admin", "Errors"],
      },
    },
  )
  .patch(
    "/errors/:id/read",
    async ({ db, user, params, status }) => {
      const markedAsRead = await ErrorLogService.markAsRead(db, params.id, user.id);

      if (!markedAsRead) {
        return status(404, ERROR_LOG_NOT_FOUND_MESSAGE);
      }

      return status(200, markedAsRead);
    },
    {
      params: "adminError.ParamById",
      response: {
        200: "adminError.DetailResponse",
        403: "adminError.Error",
        404: "adminError.Error",
      },
      detail: {
        summary: "Mark an error log entry as read",
        tags: ["Admin", "Errors"],
      },
    },
  );
