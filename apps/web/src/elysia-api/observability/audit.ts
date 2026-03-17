import { type Prisma, type PrismaClient, prisma } from "@rezumerai/database";
import { createLogger } from "@/lib/logger";
import { toPrismaJsonValue } from "./redaction";
import { getRequestContext } from "./request-context";

const logger = createLogger({ module: "audit" });

export type AuditLogCategoryValue = "USER_ACTION" | "SYSTEM_ACTIVITY" | "DATABASE_CHANGE";
type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

export interface CreateAuditLogInput {
  category: AuditLogCategoryValue;
  eventType: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  userId?: string | null;
  endpoint?: string | null;
  method?: string | null;
  serviceName?: string | null;
  requestMetadata?: unknown;
  beforeValues?: unknown;
  afterValues?: unknown;
  db?: DatabaseClient;
}

export interface RequestAuditInput {
  request: Request;
  statusCode: number;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  serviceName?: string | null;
  metadata?: Record<string, unknown>;
}

const REQUEST_METHOD_ACTIONS: Record<string, string> = {
  GET: "VIEW",
  HEAD: "VIEW",
  OPTIONS: "VIEW",
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

const DEFAULT_REQUEST_AUDIT_EXCLUDE = new Set<string>(["/api/health", "/api"]);
const AUDITABLE_GET_PREFIXES = ["/api/admin"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeResourceType(pathname: string): string {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "api")
    .slice(0, 2)
    .map((segment) => segment.replace(/[^a-zA-Z0-9]+/g, "_"))
    .filter(Boolean)
    .map((segment) => segment.toUpperCase());

  return segments.length > 0 ? segments.join("_") : "SYSTEM";
}

function resolveResourceId(params: unknown): string | null {
  if (!isRecord(params)) {
    return null;
  }

  const candidateKeys = ["id", "userId", "resumeId", "errorId", "auditId"] as const;

  for (const key of candidateKeys) {
    const value = params[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

function shouldAuditRequest(pathname: string, method: string): boolean {
  if (DEFAULT_REQUEST_AUDIT_EXCLUDE.has(pathname)) {
    return false;
  }

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    return true;
  }

  return AUDITABLE_GET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function persistAuditLog(input: CreateAuditLogInput): Promise<void> {
  const db = input.db ?? prisma;

  await db.auditLog.create({
    data: {
      category: input.category,
      eventType: input.eventType,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      userId: input.userId ?? null,
      endpoint: input.endpoint ?? null,
      method: input.method ?? null,
      serviceName: input.serviceName ?? null,
      requestMetadata: toPrismaJsonValue(input.requestMetadata) ?? undefined,
      beforeValues: toPrismaJsonValue(input.beforeValues) ?? undefined,
      afterValues: toPrismaJsonValue(input.afterValues) ?? undefined,
    },
  });
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    await persistAuditLog(input);
  } catch (error: unknown) {
    logger.error({ err: error, category: input.category, eventType: input.eventType }, "Failed to persist audit log");
  }
}

export async function recordRequestAuditLog(input: RequestAuditInput): Promise<void> {
  const url = new URL(input.request.url);
  const method = input.request.method.toUpperCase();

  if (!shouldAuditRequest(url.pathname, method)) {
    return;
  }

  const context = getRequestContext();
  const userId = context?.userId ?? null;
  const category: AuditLogCategoryValue = userId ? "USER_ACTION" : "SYSTEM_ACTIVITY";

  await createAuditLog({
    category,
    eventType: `${method}_REQUEST`,
    action: REQUEST_METHOD_ACTIONS[method] ?? method,
    resourceType: normalizeResourceType(url.pathname),
    resourceId: resolveResourceId(input.params),
    userId,
    endpoint: url.pathname,
    method,
    serviceName:
      input.serviceName ?? (typeof context?.metadata.serviceName === "string" ? context.metadata.serviceName : null),
    requestMetadata: {
      requestId: context?.requestId ?? null,
      statusCode: input.statusCode,
      query: input.query,
      params: input.params,
      body: input.body,
      metadata: {
        ...(context?.metadata ?? {}),
        ...(input.metadata ?? {}),
      },
    },
  });
}

export async function recordDatabaseAuditLog(options: {
  eventType: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  beforeValues?: unknown;
  afterValues?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const context = getRequestContext();

  await createAuditLog({
    category: "DATABASE_CHANGE",
    eventType: options.eventType,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId ?? null,
    userId: context?.userId ?? null,
    endpoint: context?.endpoint ?? null,
    method: context?.method ?? null,
    serviceName: typeof context?.metadata.serviceName === "string" ? context.metadata.serviceName : null,
    requestMetadata: {
      requestId: context?.requestId ?? null,
      source: context?.source ?? null,
      metadata: {
        ...(context?.metadata ?? {}),
        ...(options.metadata ?? {}),
      },
    },
    beforeValues: options.beforeValues,
    afterValues: options.afterValues,
  });
}

export async function recordSystemActivityLog(options: {
  eventType: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  serviceName?: string | null;
  metadata?: Record<string, unknown>;
  afterValues?: unknown;
}): Promise<void> {
  const context = getRequestContext();

  await createAuditLog({
    category: "SYSTEM_ACTIVITY",
    eventType: options.eventType,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId ?? null,
    endpoint: context?.endpoint ?? null,
    method: context?.method ?? null,
    serviceName: options.serviceName ?? null,
    requestMetadata: {
      requestId: context?.requestId ?? null,
      source: context?.source ?? null,
      metadata: {
        ...(context?.metadata ?? {}),
        ...(options.metadata ?? {}),
      },
    },
    afterValues: options.afterValues,
  });
}

export function getRequestActionLabel(method: string): string {
  return REQUEST_METHOD_ACTIONS[method.toUpperCase()] ?? method.toUpperCase();
}

export function toAuditSearchWhere(search: string): Prisma.AuditLogWhereInput {
  const trimmed = search.trim();

  if (!trimmed) {
    return {};
  }

  return {
    OR: [
      { eventType: { contains: trimmed, mode: "insensitive" } },
      { action: { contains: trimmed, mode: "insensitive" } },
      { resourceType: { contains: trimmed, mode: "insensitive" } },
      { resourceId: { contains: trimmed, mode: "insensitive" } },
      { endpoint: { contains: trimmed, mode: "insensitive" } },
      { method: { contains: trimmed, mode: "insensitive" } },
      { serviceName: { contains: trimmed, mode: "insensitive" } },
      { user: { is: { email: { contains: trimmed, mode: "insensitive" } } } },
      { user: { is: { name: { contains: trimmed, mode: "insensitive" } } } },
    ],
  };
}
