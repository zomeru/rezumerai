import Elysia from "elysia";
import { z } from "zod";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import {
  AdminModel,
  type AnalyticsQueryInput,
  type AuditLogListQueryInput,
  type ErrorLogListQueryInput,
  type UserListQueryInput,
} from "./model";
import { AdminService, ErrorLogService } from "./service";

const ADMIN_FORBIDDEN_MESSAGE = "Admin access is required";
const ERROR_LOG_NOT_FOUND_MESSAGE = AdminService.messages.ERROR_LOG_NOT_FOUND_MESSAGE;
const USER_NOT_FOUND_MESSAGE = AdminService.messages.USER_NOT_FOUND_MESSAGE;
const AUDIT_LOG_NOT_FOUND_MESSAGE = AdminService.messages.AUDIT_LOG_NOT_FOUND_MESSAGE;
const CONFIG_NOT_FOUND_MESSAGE = AdminService.messages.CONFIG_NOT_FOUND_MESSAGE;
const LAST_ADMIN_ROLE_CHANGE_MESSAGE = AdminService.messages.LAST_ADMIN_ROLE_CHANGE_MESSAGE;
const PASSWORD_CONFIRMATION_MISMATCH_MESSAGE = "Passwords do not match.";

function parseErrorListQuery(query: ErrorLogListQueryInput): {
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

function parseUserListQuery(query: UserListQueryInput) {
  return {
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    search: query.search?.trim() || undefined,
    role: query.role ?? null,
  };
}

function parseAuditListQuery(query: AuditLogListQueryInput) {
  return {
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    search: query.search?.trim() || undefined,
    category: query.category ?? null,
  };
}

function parseAnalyticsQuery(query: AnalyticsQueryInput): number | undefined {
  return query.timeframeDays ? Number(query.timeframeDays) : undefined;
}

export const adminModule = new Elysia({ name: "module/admin", prefix: "/admin" })
  .use(prismaPlugin)
  .use(authPlugin)
  .use(AdminModel)
  // Keep the admin policy local to the admin module so it cannot affect sibling routes.
  .derive(async ({ user, set }) => {
    if (typeof user?.id !== "string") {
      set.status = 403;
      return {
        __forbidden: true as const,
      };
    }

    if (user.role !== "ADMIN") {
      set.status = 403;
      return {
        __forbidden: true as const,
      };
    }

    return {
      __forbidden: false as const,
    };
  })
  .onBeforeHandle(({ __forbidden, status }) => {
    if (__forbidden) {
      return status(403, ADMIN_FORBIDDEN_MESSAGE);
    }
  })
  .get(
    "/errors",
    async ({ db, query, status }) => {
      const result = await ErrorLogService.listErrorLogs(db, parseErrorListQuery(query));

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
  )
  .get(
    "/users",
    async ({ db, query, status }) => {
      const result = await AdminService.listUsers(db, parseUserListQuery(query));
      return status(200, result);
    },
    {
      query: "adminUser.QueryList",
      response: {
        200: "adminUser.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List platform users for admin management",
        tags: ["Admin", "Users"],
      },
    },
  )
  .get(
    "/users/:id",
    async ({ db, params, status }) => {
      const result = await AdminService.getUserById(db, params.id);

      if (!result) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      return status(200, result);
    },
    {
      params: "adminUser.ParamById",
      response: {
        200: "adminUser.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Get detailed admin view of a user account",
        tags: ["Admin", "Users"],
      },
    },
  )
  .patch(
    "/users/:id/role",
    async ({ db, params, user, body, status }) => {
      const result = await AdminService.updateUserRole(db, user.id, params.id, body.role);

      if (result.error === USER_NOT_FOUND_MESSAGE) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      if (result.error === LAST_ADMIN_ROLE_CHANGE_MESSAGE) {
        return status(409, LAST_ADMIN_ROLE_CHANGE_MESSAGE);
      }

      if (!result.user) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      return status(200, result.user);
    },
    {
      params: "adminUser.ParamById",
      body: "adminUser.RoleUpdateInput",
      response: {
        200: "adminUser.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
        409: "adminUser.Error",
      },
      detail: {
        summary: "Update a user's role",
        tags: ["Admin", "Users"],
      },
    },
  )
  .patch(
    "/users/:id/password",
    async ({ db, params, user, body, request, status }) => {
      if (body.password !== body.confirmPassword) {
        return status(422, PASSWORD_CONFIRMATION_MISMATCH_MESSAGE);
      }

      const result = await AdminService.updateUserPassword(db, user.id, params.id, body.password, request.headers);

      if (result.error === USER_NOT_FOUND_MESSAGE) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      if (!result.user) {
        return status(404, USER_NOT_FOUND_MESSAGE);
      }

      return status(200, result.user);
    },
    {
      params: "adminUser.ParamById",
      body: "adminUser.PasswordUpdateInput",
      response: {
        200: "adminUser.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
        422: "adminUser.Error",
      },
      detail: {
        summary: "Set or replace a user's password",
        tags: ["Admin", "Users"],
      },
    },
  )
  .get(
    "/system-config",
    async ({ db, status }) => {
      const result = await AdminService.listSystemConfigurations(db);
      return status(200, result);
    },
    {
      response: {
        200: "adminConfig.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List application-wide system configuration entries",
        tags: ["Admin", "System Configuration"],
      },
    },
  )
  .patch(
    "/system-config/:name",
    async ({ db, params, user, body, status }) => {
      try {
        const result = await AdminService.updateSystemConfiguration(db, user.id, params.name, body.value);

        if (result.error === CONFIG_NOT_FOUND_MESSAGE) {
          return status(404, CONFIG_NOT_FOUND_MESSAGE);
        }

        if (!result.configuration) {
          return status(404, CONFIG_NOT_FOUND_MESSAGE);
        }

        return status(200, result.configuration);
      } catch (error: unknown) {
        if (error instanceof z.ZodError || error instanceof Error) {
          return status(422, error instanceof Error ? error.message : "Invalid configuration payload");
        }

        throw error;
      }
    },
    {
      params: "adminConfig.ParamByName",
      body: "adminConfig.UpdateInput",
      response: {
        200: "adminConfig.Entry",
        403: "adminUser.Error",
        404: "adminUser.Error",
        422: "adminUser.Error",
      },
      detail: {
        summary: "Update a system configuration entry",
        tags: ["Admin", "System Configuration"],
      },
    },
  )
  .get(
    "/features",
    async ({ db, status }) => {
      const result = await AdminService.listFeatureFlags(db);
      return status(200, result);
    },
    {
      response: {
        200: "adminFeature.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List runtime feature flags",
        tags: ["Admin", "Features"],
      },
    },
  )
  .put(
    "/features/:name",
    async ({ db, params, user, body, status }) => {
      const result = await AdminService.saveFeatureFlag(db, user.id, params.name, body);
      return status(200, result);
    },
    {
      params: "adminFeature.ParamByName",
      body: "adminFeature.SaveInput",
      response: {
        200: "adminFeature.Entry",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Create or update a runtime feature flag",
        tags: ["Admin", "Features"],
      },
    },
  )
  .get(
    "/audit-logs",
    async ({ db, query, status }) => {
      const result = await AdminService.listAuditLogs(db, parseAuditListQuery(query));
      return status(200, result);
    },
    {
      query: "adminAudit.QueryList",
      response: {
        200: "adminAudit.ListResponse",
        403: "adminUser.Error",
      },
      detail: {
        summary: "List audit logs grouped by user, system, and database activity",
        tags: ["Admin", "Audit Logs"],
      },
    },
  )
  .get(
    "/audit-logs/:id",
    async ({ db, params, status }) => {
      const result = await AdminService.getAuditLogById(db, params.id);

      if (!result) {
        return status(404, AUDIT_LOG_NOT_FOUND_MESSAGE);
      }

      return status(200, result);
    },
    {
      params: "adminAudit.ParamById",
      response: {
        200: "adminAudit.DetailResponse",
        403: "adminUser.Error",
        404: "adminUser.Error",
      },
      detail: {
        summary: "Get detailed audit log metadata",
        tags: ["Admin", "Audit Logs"],
      },
    },
  )
  .get(
    "/analytics",
    async ({ db, query, status }) => {
      const result = await AdminService.getAnalyticsDashboard(db, parseAnalyticsQuery(query));
      return status(200, result);
    },
    {
      query: "adminAnalytics.Query",
      response: {
        200: "adminAnalytics.Response",
        403: "adminUser.Error",
      },
      detail: {
        summary: "Fetch the admin analytics dashboard data",
        tags: ["Admin", "Analytics"],
      },
    },
  );
