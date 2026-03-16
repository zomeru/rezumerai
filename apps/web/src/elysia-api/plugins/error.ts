import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type Prisma, prisma } from "@rezumerai/database";
import Elysia from "elysia";
import { serverEnv } from "@/env";
import { createLogger } from "@/lib/logger";
import { runPostResponseTask } from "../observability/post-response";

const logger = createLogger({ module: "error-tracking" });

const isProd = serverEnv?.NODE_ENV === "production";
const isDev = serverEnv?.NODE_ENV === "development";

const REDACTED_VALUE = "[REDACTED]";
const MAX_STRING_LENGTH = 10_000;
const MAX_DEPTH = 8;
type SerializableJson = string | number | boolean | null | SerializableJson[] | { [key: string]: SerializableJson };

const SENSITIVE_KEYWORDS = [
  "password",
  "pass",
  "pwd",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "api_key",
  "apikey",
  "client_secret",
  "private_key",
  "refresh_token",
  "access_token",
  "id_token",
] as const;

interface ErrorTrackingContext {
  request: Request;
  code: string;
  error: unknown;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  user?: {
    id?: string;
  } | null;
  extraMetadata?: Record<string, unknown>;
}

interface CapturedUnhandledError {
  errorName: string;
  message: string;
  stack: string | null;
  stackTraceJson: string;
  endpoint: string;
  method: string;
  functionName: string | null;
  queryParams: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
  requestBody: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
  headers: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null;
  userId: string | null;
  environment: "development" | "production";
  timestamp: string;
  metadata: Record<string, unknown>;
}

type PrismaKnownRequestError = {
  code: string;
  clientVersion: string;
  meta?: Record<string, unknown>;
};

function isPrismaKnownRequestError(error: unknown): error is PrismaKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "clientVersion" in error &&
    typeof error.clientVersion === "string"
  );
}

const prismaErrorResponse = (error: PrismaKnownRequestError) => {
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

function getWorkspaceRoot(): string {
  const cwd = process.cwd();

  if (cwd.endsWith(path.join("apps", "web"))) {
    return path.resolve(cwd, "..", "..");
  }

  return cwd;
}

function getLogsDirectory(): string {
  return path.join(getWorkspaceRoot(), "logs", "errors");
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return SENSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}… [truncated]`;
}

function sanitizeFilenameSegment(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, "_");

  if (normalized.length > 0) {
    return normalized;
  }

  return "Error";
}

function getErrorName(error: unknown): string {
  if (error instanceof Error && error.name.trim().length > 0) {
    return error.name.trim();
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string" &&
    error.name.trim().length > 0
  ) {
    return error.name.trim();
  }

  return "UnhandledError";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return truncateString(error.message.trim());
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return truncateString(error.message.trim());
  }

  return "Unknown error";
}

function getStack(error: unknown): string | null {
  if (error instanceof Error && typeof error.stack === "string" && error.stack.trim().length > 0) {
    return truncateString(error.stack);
  }

  return null;
}

function getFunctionNameFromStack(stack: string | null): string | null {
  if (!stack) {
    return null;
  }

  const lines = stack.split("\n").map((line) => line.trim());

  for (const line of lines) {
    const match = line.match(/^at\s+(?:async\s+)?([^\s(]+)\s*\(/);

    if (!match?.[1]) {
      continue;
    }

    const candidate = match[1];

    if (candidate.includes("node_modules") || candidate.startsWith("node:")) {
      continue;
    }

    return candidate.replace(/^new\s+/, "");
  }

  return null;
}

function toSerializableValue(value: unknown, depth = 0): SerializableJson {
  if (depth > MAX_DEPTH) {
    return "[Max depth reached]";
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
      stack: value.stack ? truncateString(value.stack) : null,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializableValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, SerializableJson> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = shouldRedactKey(key) ? REDACTED_VALUE : toSerializableValue(nestedValue, depth + 1);
    }

    return result;
  }

  return String(value);
}

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null {
  if (value === undefined) {
    return null;
  }

  const serialized = toSerializableValue(value);

  if (serialized === undefined) {
    return null;
  }

  try {
    return serialized;
  } catch {
    return truncateString(String(serialized));
  }
}

function toStackTraceJson(errorName: string, message: string, stack: string | null): string {
  const stackLines = stack
    ? stack
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return JSON.stringify(
    {
      errorName,
      message,
      stackLines,
      rawStack: stack,
    },
    null,
    2,
  );
}

function formatFilenameTimestamp(date: Date): { dateStamp: string; timeStamp: string } {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return {
    dateStamp: `${year}-${month}-${day}`,
    timeStamp: `${hours}-${minutes}-${seconds}`,
  };
}

function toPrettyJson(value: unknown): string {
  return JSON.stringify(toSerializableValue(value), null, 2);
}

function buildFileLogContent(data: CapturedUnhandledError): string {
  return [
    "============================================================",
    "Rezumer Error Log",
    "============================================================",
    `Timestamp      : ${data.timestamp}`,
    `Environment    : ${data.environment}`,
    `Error Name     : ${data.errorName}`,
    `Message        : ${data.message}`,
    `Method         : ${data.method}`,
    `Endpoint       : ${data.endpoint}`,
    `Function       : ${data.functionName ?? "Unknown"}`,
    `User ID        : ${data.userId ?? "N/A"}`,
    "",
    "--- Stack Trace ---",
    data.stack ?? "(no stack trace)",
    "",
    "--- Query Params ---",
    toPrettyJson(data.queryParams),
    "",
    "--- Request Body ---",
    toPrettyJson(data.requestBody),
    "",
    "--- Headers (redacted) ---",
    toPrettyJson(data.headers),
    "",
    "--- Metadata ---",
    toPrettyJson(data.metadata),
    "",
  ].join("\n");
}

function extractCapturedError(context: ErrorTrackingContext): CapturedUnhandledError {
  const now = new Date();
  const url = new URL(context.request.url);
  const errorName = getErrorName(context.error);
  const message = getErrorMessage(context.error);
  const stack = getStack(context.error);
  const stackTraceJson = toStackTraceJson(errorName, message, stack);

  const queryFromUrl = Object.fromEntries(url.searchParams.entries());
  const queryParams = toPrismaJsonValue(context.query ?? queryFromUrl);
  const requestBody = toPrismaJsonValue(context.body ?? null);
  const headers = toPrismaJsonValue(Object.fromEntries(context.request.headers.entries()));

  const userId =
    context.user && typeof context.user === "object" && typeof context.user.id === "string" ? context.user.id : null;

  const environment: "development" | "production" =
    process.env.NODE_ENV === "production" ? "production" : "development";
  const serializedExtraMetadata = toSerializableValue(context.extraMetadata ?? {});
  const extraMetadata =
    typeof serializedExtraMetadata === "object" &&
    serializedExtraMetadata !== null &&
    !Array.isArray(serializedExtraMetadata)
      ? serializedExtraMetadata
      : {
          extra: serializedExtraMetadata,
        };

  return {
    errorName,
    message,
    stack,
    stackTraceJson,
    endpoint: url.pathname,
    method: context.request.method,
    functionName: getFunctionNameFromStack(stack),
    queryParams,
    requestBody,
    headers,
    userId,
    environment,
    timestamp: now.toISOString(),
    metadata: {
      code: context.code,
      pathname: url.pathname,
      search: url.search,
      params: toSerializableValue(context.params ?? null),
      ...extraMetadata,
    },
  };
}

async function persistUnhandledErrorToDatabase(data: CapturedUnhandledError): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        errorName: data.errorName,
        message: data.message,
        stackTraceJson: data.stackTraceJson,
        endpoint: data.endpoint,
        method: data.method,
        functionName: data.functionName,
        queryParams: data.queryParams ?? undefined,
        requestBody: data.requestBody ?? undefined,
        headers: data.headers ?? undefined,
        userId: data.userId,
        environment: data.environment,
      },
    });
  } catch (databaseError: unknown) {
    logger.error({ err: databaseError }, "Failed to write error to database");
  }
}

async function writeUnhandledErrorToFile(data: CapturedUnhandledError): Promise<void> {
  if (!isDev) {
    return;
  }

  try {
    const logsDirectory = getLogsDirectory();
    const now = new Date(data.timestamp);
    const { dateStamp, timeStamp } = formatFilenameTimestamp(now);
    const fileName = `${sanitizeFilenameSegment(data.errorName)}_${dateStamp}_${timeStamp}.log`;
    const filePath = path.join(logsDirectory, fileName);

    await mkdir(logsDirectory, { recursive: true });
    await writeFile(filePath, buildFileLogContent(data), "utf-8");
  } catch (fileError: unknown) {
    logger.error({ err: fileError }, "Failed to write error to file");
  }
}

async function trackUnhandledError(context: ErrorTrackingContext): Promise<void> {
  const captured = extractCapturedError(context);

  await Promise.all([persistUnhandledErrorToDatabase(captured), writeUnhandledErrorToFile(captured)]);
}

export interface TrackHandledErrorOptions {
  request: Request;
  error: unknown;
  code?: string;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function trackHandledError(options: TrackHandledErrorOptions): Promise<void> {
  try {
    await trackUnhandledError({
      request: options.request,
      code: options.code ?? "HANDLED_ERROR",
      error: options.error,
      body: options.body,
      query: options.query,
      params: options.params,
      user: options.userId ? { id: options.userId } : null,
      extraMetadata: options.metadata,
    });
  } catch (trackingError: unknown) {
    logger.error({ err: trackingError, code: options.code }, "Failed to track handled error");
  }
}

function getErrorContextBody(context: unknown): unknown {
  return typeof context === "object" && context !== null && "body" in context ? context.body : undefined;
}

function getErrorContextQuery(context: unknown): unknown {
  return typeof context === "object" && context !== null && "query" in context ? context.query : undefined;
}

function getErrorContextParams(context: unknown): unknown {
  return typeof context === "object" && context !== null && "params" in context ? context.params : undefined;
}

function getErrorContextUser(context: unknown): { id?: string } | null {
  if (typeof context !== "object" || context === null || !("user" in context)) {
    return null;
  }

  const { user } = context;
  return typeof user === "object" && user !== null ? user : null;
}

/**
 * Centralized error-handling plugin
 */
export const errorPlugin = new Elysia({ name: "plugin/error" }).onError({ as: "global" }, async (context) => {
  const { code, error, status, request } = context;
  const body = getErrorContextBody(context);
  const query = getErrorContextQuery(context);
  const params = getErrorContextParams(context);
  const user = getErrorContextUser(context);

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
  if (isPrismaKnownRequestError(error)) {
    const { status: code, message } = prismaErrorResponse(error);
    return status(code, message);
  }

  // ─────────────────────────────────────────────
  // Unknown / unhandled errors
  // ─────────────────────────────────────────────
  const trackingContext: ErrorTrackingContext = {
    code: String(code),
    error,
    request,
    body,
    query,
    params,
    user,
  };

  runPostResponseTask(async () => {
    await trackUnhandledError(trackingContext);
  }, "error-tracking");

  if (!isProd) {
    logger.error({ code, err: error }, "Request error");
  }

  return status(500, !isProd && error instanceof Error ? error.message : "Internal server error");
});
