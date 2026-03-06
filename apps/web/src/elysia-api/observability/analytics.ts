import { prisma } from "@rezumerai/database";
import { toPrismaJsonValue } from "./redaction";
import { getRequestContext } from "./request-context";

export interface RecordAnalyticsEventInput {
  source: "API_REQUEST" | "BACKGROUND_JOB";
  eventType: string;
  endpoint?: string | null;
  method?: string | null;
  statusCode?: number | null;
  durationMs: number;
  errorCode?: string | null;
  errorName?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAnalyticsEvent(input: RecordAnalyticsEventInput): Promise<void> {
  const context = getRequestContext();

  try {
    await prisma.analyticsEvent.create({
      data: {
        source: input.source,
        eventType: input.eventType,
        endpoint: input.endpoint ?? context?.endpoint ?? null,
        method: input.method ?? context?.method ?? null,
        statusCode: input.statusCode ?? null,
        durationMs: input.durationMs,
        userId: context?.userId ?? null,
        isAdmin: context?.userRole === "ADMIN",
        errorCode: input.errorCode ?? null,
        errorName: input.errorName ?? null,
        metadata:
          toPrismaJsonValue({
            requestId: context?.requestId ?? null,
            source: context?.source ?? null,
            metadata: {
              ...(context?.metadata ?? {}),
              ...(input.metadata ?? {}),
            },
          }) ?? undefined,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown analytics logging error";
    console.error(`[ANALYTICS] Failed to persist analytics event: ${message}`);
  }
}
