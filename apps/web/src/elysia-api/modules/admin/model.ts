import Elysia, { t } from "elysia";

const ErrorLogListQuery = t.Object({
  page: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  pageSize: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  isRead: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
});

const ErrorLogParamById = t.Object({
  id: t.String({ minLength: 1 }),
});

const ErrorLogListItem = t.Object({
  id: t.String(),
  errorName: t.String(),
  createdAt: t.String({ format: "date-time" }),
  endpoint: t.String(),
  method: t.String(),
  functionName: t.Nullable(t.String()),
  isRead: t.Boolean(),
});

const ErrorLogPagination = t.Object({
  page: t.Integer({ minimum: 1 }),
  pageSize: t.Integer({ minimum: 1 }),
  totalCount: t.Integer({ minimum: 0 }),
  totalPages: t.Integer({ minimum: 0 }),
});

const ErrorLogListResponse = t.Object({
  items: t.Array(ErrorLogListItem),
  pagination: ErrorLogPagination,
});

const ErrorLogReadByUser = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
});

const ErrorLogDetail = t.Object({
  id: t.String(),
  errorName: t.String(),
  message: t.String(),
  stackTraceJson: t.String(),
  endpoint: t.String(),
  method: t.String(),
  functionName: t.Nullable(t.String()),
  queryParams: t.Nullable(t.Any()),
  requestBody: t.Nullable(t.Any()),
  headers: t.Nullable(t.Any()),
  userId: t.Nullable(t.String()),
  environment: t.Union([t.Literal("development"), t.Literal("production")]),
  createdAt: t.String({ format: "date-time" }),
  isRead: t.Boolean(),
  readAt: t.Nullable(t.String({ format: "date-time" })),
  readByUserId: t.Nullable(t.String()),
  readByUser: t.Nullable(ErrorLogReadByUser),
});

export type ErrorLogListQueryInput = typeof ErrorLogListQuery.static;

export const AdminErrorModel = new Elysia().model({
  "adminError.QueryList": ErrorLogListQuery,
  "adminError.ParamById": ErrorLogParamById,
  "adminError.ListResponse": ErrorLogListResponse,
  "adminError.DetailResponse": ErrorLogDetail,
  "adminError.Error": t.String(),
} as const);
