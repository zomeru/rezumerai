import { prisma } from "@rezumerai/database";
import { recordDatabaseAuditLog } from "./audit";
import { toSerializableValue } from "./redaction";
import { getRequestContext } from "./request-context";

const AUDITABLE_OPERATIONS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
]);

const INTERNAL_MODELS = new Set(["AuditLog", "AnalyticsEvent", "Session", "Account", "Verification", "SampleTable"]);
const SLOW_QUERY_THRESHOLD_MS = 100;
const MAX_SLOW_QUERY_SAMPLES = 5;

function toDelegateKey(model: string): string {
  return `${model.slice(0, 1).toLowerCase()}${model.slice(1)}`;
}

function getModelDelegate(model: string): Record<string, (...args: unknown[]) => Promise<unknown>> | null {
  const delegateKey = toDelegateKey(model);
  const delegate = (prisma as unknown as Record<string, unknown>)[delegateKey];

  if (!delegate || typeof delegate !== "object") {
    return null;
  }

  return delegate as Record<string, (...args: unknown[]) => Promise<unknown>>;
}

async function readBeforeSnapshot(model: string, operation: string, args: unknown): Promise<unknown> {
  const delegate = getModelDelegate(model);

  if (!delegate || typeof args !== "object" || args === null) {
    return null;
  }

  if ((operation === "update" || operation === "delete" || operation === "upsert") && "where" in args) {
    try {
      return await delegate.findUnique?.({ where: (args as { where: unknown }).where });
    } catch {
      return { where: toSerializableValue((args as { where: unknown }).where) };
    }
  }

  if (operation === "updateMany" || operation === "deleteMany" || operation === "createMany") {
    return {
      criteria: toSerializableValue(args),
    };
  }

  return null;
}

function resolveResourceId(result: unknown, args: unknown): string | null {
  if (result && typeof result === "object" && "id" in result && typeof result.id === "string") {
    return result.id;
  }

  if (args && typeof args === "object" && "where" in args) {
    const where = (args as { where?: Record<string, unknown> }).where;

    if (where && typeof where.id === "string") {
      return where.id;
    }
  }

  return null;
}

function resolveAction(operation: string, beforeSnapshot: unknown): string {
  switch (operation) {
    case "create":
      return "CREATE";
    case "createMany":
      return "BULK_CREATE";
    case "update":
      return "UPDATE";
    case "updateMany":
      return "BULK_UPDATE";
    case "delete":
      return "DELETE";
    case "deleteMany":
      return "BULK_DELETE";
    case "upsert":
      return beforeSnapshot ? "UPSERT_UPDATE" : "UPSERT_CREATE";
    default:
      return operation.toUpperCase();
  }
}

function resolveAfterSnapshot(operation: string, args: unknown, result: unknown): unknown {
  if (operation === "createMany" || operation === "updateMany" || operation === "deleteMany") {
    if (result && typeof result === "object" && "count" in result) {
      return {
        count: result.count,
        criteria: toSerializableValue(args),
      };
    }

    return {
      criteria: toSerializableValue(args),
    };
  }

  return result;
}

function recordDatabaseQueryMetrics(model: string | null, operation: string, durationMs: number): void {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  const queryCount = typeof context.metadata.dbQueryCount === "number" ? context.metadata.dbQueryCount + 1 : 1;
  const totalDurationMs =
    typeof context.metadata.dbQueryDurationMs === "number"
      ? context.metadata.dbQueryDurationMs + durationMs
      : durationMs;
  const slowQueries = Array.isArray(context.metadata.slowDbQueries) ? [...context.metadata.slowDbQueries] : [];

  if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
    slowQueries.push({
      durationMs: Math.round(durationMs),
      model: model ?? "UNKNOWN",
      operation,
    });
  }

  context.metadata = {
    ...context.metadata,
    dbQueryCount: queryCount,
    dbQueryDurationMs: Math.round(totalDurationMs * 100) / 100,
    ...(slowQueries.length > 0 ? { slowDbQueries: slowQueries.slice(-MAX_SLOW_QUERY_SAMPLES) } : {}),
  };
}

export const observedPrisma = prisma.$extends({
  name: "admin-observability",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const normalizedModel = typeof model === "string" ? model : null;
        const shouldAudit =
          normalizedModel && AUDITABLE_OPERATIONS.has(operation) && !INTERNAL_MODELS.has(normalizedModel);
        const beforeSnapshot = shouldAudit ? await readBeforeSnapshot(normalizedModel, operation, args) : null;
        const startedAt = performance.now();
        const result = await query(args);
        recordDatabaseQueryMetrics(normalizedModel, operation, performance.now() - startedAt);

        if (!shouldAudit || !normalizedModel) {
          return result;
        }

        void recordDatabaseAuditLog({
          eventType: `PRISMA_${operation.toUpperCase()}`,
          action: resolveAction(operation, beforeSnapshot),
          resourceType: normalizedModel,
          resourceId: resolveResourceId(result, args),
          beforeValues: beforeSnapshot,
          afterValues: resolveAfterSnapshot(operation, args, result),
          metadata: {
            model: normalizedModel,
            operation,
          },
        });

        return result;
      },
    },
  },
}) as typeof prisma;
