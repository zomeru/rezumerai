import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { createTool } from "@mastra/core/tools";
import {
  type AiConfiguration,
  type AssistantChatMessage,
  type AssistantRoleScope,
  DEFAULT_LANDING_PAGE_CONTENT,
  LandingPageInformationSchema,
  SYSTEM_CONFIGURATION_KEYS,
} from "@rezumerai/types";
import { z } from "zod";
import { compactText } from "./utils";

interface ResumeListRow {
  id: string;
  public: boolean;
  title: string | null;
  updatedAt: Date;
}

interface DraftListRow {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface UserListRow {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
  role: string;
}

interface ErrorLogListRow {
  createdAt: Date;
  endpoint: string | null;
  errorName: string;
  functionName: string | null;
  id: string;
  isRead: boolean;
  method: string | null;
}

interface AuditLogListRow {
  action: string;
  category: string;
  createdAt: Date;
  eventType: string;
  id: string;
  method: string | null;
  resourceType: string | null;
  serviceName: string;
  user: {
    email: string;
  } | null;
}

interface AnalyticsActiveUserRow {
  userId: string | null;
}

interface SystemConfigurationValueRow {
  value: unknown;
}

interface DatabaseClient {
  analyticsEvent: {
    count: (...args: any[]) => Promise<number>;
    findMany: (...args: any[]) => Promise<unknown[]>;
  };
  auditLog: {
    findMany: (...args: any[]) => Promise<unknown[]>;
  };
  errorLog: {
    findMany: (...args: any[]) => Promise<unknown[]>;
  };
  resume: {
    findMany: (...args: any[]) => Promise<unknown[]>;
  };
  systemConfiguration: {
    findUnique: (...args: any[]) => Promise<SystemConfigurationValueRow | null>;
  };
  user: {
    findMany: (...args: any[]) => Promise<unknown[]>;
  };
}

type AssistantToolName =
  | "getPublicAppOverview"
  | "listMyRecentResumes"
  | "listMyRecentDrafts"
  | "getMyOptimizationCredits"
  | "getMyCurrentModelSettings"
  | "listRegisteredUsers"
  | "listRecentErrorLogs"
  | "listRecentAuditLogs"
  | "getAnalyticsSummary"
  | "getAiConfiguration";

type AssistantExecutionStrategy =
  | {
      mode: "direct-reply";
      reply: string;
      requestedLimit: number | null;
    }
  | {
      mode: "sign-in-required";
      reply: string;
      requestedLimit: number | null;
    }
  | {
      mode: "access-denied";
      reply: string;
      requestedLimit: number | null;
    }
  | {
      mode: "forced-tool";
      toolName: AssistantToolName;
      requestedLimit: number | null;
    }
  | {
      mode: "model";
      requestedLimit: number | null;
    };

interface AssistantAgentContext {
  currentPath?: string;
  db: DatabaseClient;
  getAiConfiguration: () => Promise<AiConfiguration>;
  getCurrentModelSettings: () => Promise<{
    models: string[];
    selectedModelId: string;
  } | null>;
  getOptimizationCredits: () => Promise<{
    dailyLimit: number;
    remainingCredits: number;
  } | null>;
  latestUserMessage: string;
  modelId: string;
  requestedLimit: number | null;
  scope: AssistantRoleScope;
  systemPrompt: string;
  userId: string | null;
}

interface AssistantAgentRunOptions {
  currentPath?: string;
  db: DatabaseClient;
  getAiConfiguration: () => Promise<AiConfiguration>;
  getCurrentModelSettings: () => Promise<{
    models: string[];
    selectedModelId: string;
  } | null>;
  getOptimizationCredits: () => Promise<{
    dailyLimit: number;
    remainingCredits: number;
  } | null>;
  history: AssistantChatMessage[];
  latestUserMessage: string;
  maxSteps: number;
  modelId: string;
  scope: AssistantRoleScope;
  systemPrompt: string;
  userId: string | null;
}

interface AssistantToolEnvelopeBase {
  entity: string;
  summary: string;
  type: "collection" | "detail" | "metric";
}

interface AssistantToolCollectionEnvelope extends AssistantToolEnvelopeBase {
  count: number;
  items: Array<Record<string, unknown>>;
  meta: Record<string, unknown> | null;
  type: "collection";
}

interface AssistantToolDetailEnvelope extends AssistantToolEnvelopeBase {
  item: Record<string, unknown>;
  type: "detail";
}

interface AssistantToolMetricEnvelope extends AssistantToolEnvelopeBase {
  data: Record<string, unknown>;
  type: "metric";
}

type AssistantToolEnvelope =
  | AssistantToolCollectionEnvelope
  | AssistantToolDetailEnvelope
  | AssistantToolMetricEnvelope;

interface AssistantGenerateOutput {
  text: string;
  toolCalls: Array<{ payload: { toolName: string } }>;
  toolResults: Array<{ payload: { isError?: boolean; result: unknown; toolName: string } }>;
}

interface AssistantRunDependencies {
  generate?: (
    messages: AssistantChatMessage[],
    options: {
      maxSteps: number;
      modelSettings?: {
        temperature?: number;
      };
      requestContext: RequestContext<AssistantAgentContext>;
    },
  ) => Promise<AssistantGenerateOutput>;
}

const assistantRequestContextSchema = z.object({
  currentPath: z.string().max(200).optional(),
  db: z.any(),
  getAiConfiguration: z.any(),
  getCurrentModelSettings: z.any(),
  getOptimizationCredits: z.any(),
  latestUserMessage: z.string().min(1),
  modelId: z.string().min(1),
  requestedLimit: z.number().int().min(1).max(100).nullable(),
  scope: z.enum(["PUBLIC", "USER", "ADMIN"]),
  systemPrompt: z.string().min(1),
  userId: z.string().nullable(),
});

const limitInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

const unknownRecordSchema = z.object({}).catchall(z.unknown());

const assistantToolEnvelopeSchema = z.union([
  z.object({
    count: z.number().int().min(0),
    entity: z.string(),
    items: z.array(unknownRecordSchema),
    meta: unknownRecordSchema.nullable(),
    summary: z.string(),
    type: z.literal("collection"),
  }),
  z.object({
    entity: z.string(),
    item: unknownRecordSchema,
    summary: z.string(),
    type: z.literal("detail"),
  }),
  z.object({
    data: unknownRecordSchema,
    entity: z.string(),
    summary: z.string(),
    type: z.literal("metric"),
  }),
]);

export const ASSISTANT_SAFE_RETRIEVAL_REPLY = "I couldn't retrieve that information.";
export const ASSISTANT_ACCESS_DENIED_REPLY = "I don't have access to that information.";
export const ASSISTANT_SIGN_IN_REPLY = "Sign in to access your account data.";
export const ASSISTANT_GREETING_REPLY = "Hello! How can I help with your resume or account today?";

function buildAssistantInstructions(requestContext: RequestContext<AssistantAgentContext>): string {
  const scope = requestContext.get("scope");
  const currentPath = requestContext.get("currentPath");
  const systemPrompt = requestContext.get("systemPrompt");
  const latestUserMessage = requestContext.get("latestUserMessage");
  const pathInstruction = currentPath ? ` CurrentPage=${currentPath}.` : "";

  return [
    systemPrompt,
    `Scope=${scope}.${pathInstruction}`,
    `If a database-backed or system-backed answer is unavailable, reply exactly: "${ASSISTANT_SAFE_RETRIEVAL_REPLY}"`,
    "Never invent users, resumes, system configuration, analytics, audit logs, error logs, or account data.",
    "For greetings or normal product questions, answer briefly and naturally.",
    `LatestUserMessage=${latestUserMessage}`,
  ].join(" ");
}

const assistantTextAgent = new Agent({
  id: "rezumerai-assistant",
  name: "Rezumerai Assistant",
  requestContextSchema: assistantRequestContextSchema,
  model: ({ requestContext }) => toMastraOpenRouterModelId(requestContext.get("modelId")),
  instructions: ({ requestContext }) =>
    buildAssistantInstructions(requestContext as RequestContext<AssistantAgentContext>),
});

function toMastraOpenRouterModelId(modelId: string): string {
  return modelId.startsWith("openrouter/") ? modelId : `openrouter/${modelId}`;
}

function clampRequestedLimit(limit: number | null | undefined, fallback: number): number {
  if (!limit || Number.isNaN(limit)) {
    return fallback;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function createCollectionEnvelope(
  entity: string,
  items: Array<Record<string, unknown>>,
  summary: string,
  meta?: Record<string, unknown>,
): AssistantToolCollectionEnvelope {
  return {
    type: "collection",
    entity,
    summary,
    count: items.length,
    items,
    meta: meta ?? null,
  };
}

function createDetailEnvelope(
  entity: string,
  item: Record<string, unknown>,
  summary: string,
): AssistantToolDetailEnvelope {
  return {
    type: "detail",
    entity,
    summary,
    item,
  };
}

function createMetricEnvelope(
  entity: string,
  data: Record<string, unknown>,
  summary: string,
): AssistantToolMetricEnvelope {
  return {
    type: "metric",
    entity,
    summary,
    data,
  };
}

function extractRequestedLimit(message: string): number | null {
  if (/\b(all|every)\b/i.test(message)) {
    return 100;
  }

  const limitMatch = message.match(/\b(\d{1,3})\b/);
  if (!limitMatch) {
    return null;
  }

  const parsed = Number.parseInt(limitMatch[1] ?? "", 10);
  return Number.isNaN(parsed) ? null : clampRequestedLimit(parsed, 5);
}

function isSimpleGreeting(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  if (normalized.length === 0 || normalized.split(/\s+/).length > 4) {
    return false;
  }

  return /^(hi|hello|hey|yo|howdy|greetings|good (morning|afternoon|evening))[!.?]*$/.test(normalized);
}

function resolveAssistantExecutionStrategy(options: {
  message: string;
  scope: AssistantRoleScope;
  userId: string | null;
}): AssistantExecutionStrategy {
  const { message, scope, userId } = options;
  const requestedLimit = extractRequestedLimit(message);
  const normalized = message.trim().toLowerCase();

  if (isSimpleGreeting(normalized)) {
    return {
      mode: "direct-reply",
      reply: ASSISTANT_GREETING_REPLY,
      requestedLimit,
    };
  }

  if (
    /\b(ai[_\s-]*config|ai configuration|system configuration|system config|configuration)\b/.test(normalized) &&
    scope !== "ADMIN"
  ) {
    return {
      mode: "access-denied",
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (
    /\b(error|errors|error log|error logs)\b/.test(normalized) &&
    !/\baudit\b/.test(normalized) &&
    scope !== "ADMIN"
  ) {
    return {
      mode: "access-denied",
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (/\baudit log|audit logs\b/.test(normalized) && scope !== "ADMIN") {
    return {
      mode: "access-denied",
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (/\banalytics|error rate|request count|active users\b/.test(normalized) && scope !== "ADMIN") {
    return {
      mode: "access-denied",
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (
    /\b(registered users|all users|list users|show users|user accounts|registered user)\b/.test(normalized) &&
    scope !== "ADMIN"
  ) {
    return {
      mode: "access-denied",
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (/\b(my resumes?|my resume list|show my resumes?|list my resumes?)\b/.test(normalized) && !userId) {
    return {
      mode: "sign-in-required",
      reply: ASSISTANT_SIGN_IN_REPLY,
      requestedLimit,
    };
  }

  if (/\b(my drafts?|show my drafts?|list my drafts?)\b/.test(normalized) && !userId) {
    return {
      mode: "sign-in-required",
      reply: ASSISTANT_SIGN_IN_REPLY,
      requestedLimit,
    };
  }

  if (/\b(my credits?|remaining credits|credits do i have)\b/.test(normalized) && !userId) {
    return {
      mode: "sign-in-required",
      reply: ASSISTANT_SIGN_IN_REPLY,
      requestedLimit,
    };
  }

  if (/\b(current model|selected model|model settings?)\b/.test(normalized) && !userId) {
    return {
      mode: "sign-in-required",
      reply: ASSISTANT_SIGN_IN_REPLY,
      requestedLimit,
    };
  }

  if (/\b(ai[_\s-]*config|ai configuration|system configuration|system config|configuration)\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "getAiConfiguration",
      requestedLimit,
    };
  }

  if (/\b(error|errors|error log|error logs)\b/.test(normalized) && !/\baudit\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "listRecentErrorLogs",
      requestedLimit,
    };
  }

  if (/\baudit log|audit logs\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "listRecentAuditLogs",
      requestedLimit,
    };
  }

  if (/\banalytics|error rate|request count|active users\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "getAnalyticsSummary",
      requestedLimit,
    };
  }

  if (/\b(registered users|all users|list users|show users|user accounts|registered user)\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "listRegisteredUsers",
      requestedLimit,
    };
  }

  if (/\b(my resumes?|my resume list|show my resumes?|list my resumes?)\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "listMyRecentResumes",
      requestedLimit,
    };
  }

  if (/\b(my drafts?|show my drafts?|list my drafts?)\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "listMyRecentDrafts",
      requestedLimit,
    };
  }

  if (/\b(my credits?|remaining credits|credits do i have)\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "getMyOptimizationCredits",
      requestedLimit,
    };
  }

  if (/\b(current model|selected model|model settings?)\b/.test(normalized)) {
    return {
      mode: "forced-tool",
      toolName: "getMyCurrentModelSettings",
      requestedLimit,
    };
  }

  if (
    /\b(what does this app do|what is rezumerai|about rezumerai|what can this app do|what can rezumerai do)\b/.test(
      normalized,
    )
  ) {
    return {
      mode: "forced-tool",
      toolName: "getPublicAppOverview",
      requestedLimit,
    };
  }

  return {
    mode: "model",
    requestedLimit,
  };
}

function createAssistantTools(context: AssistantAgentContext) {
  const readLimit = (fallback: number): number => clampRequestedLimit(context.requestedLimit, fallback);

  return {
    getPublicAppOverview: createTool({
      id: "getPublicAppOverview",
      description: "Read the grounded public overview of Rezumerai from stored landing-page content.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        const storedLanding = await context.db.systemConfiguration.findUnique({
          where: { name: SYSTEM_CONFIGURATION_KEYS.LANDING_PAGE_INFORMATION },
          select: { value: true },
        });
        const parsedLanding = LandingPageInformationSchema.safeParse(storedLanding?.value);
        const landing = parsedLanding.success ? parsedLanding.data : DEFAULT_LANDING_PAGE_CONTENT;

        return createDetailEnvelope(
          "public_app_overview",
          {
            title: landing.hero.title,
            summary: landing.hero.description,
            trustBadges: landing.hero.trustBadges,
            features: landing.featureSection.items.map((item) => item.title),
          },
          "Grounded public overview of Rezumerai.",
        );
      },
    }),
    listMyRecentResumes: createTool({
      id: "listMyRecentResumes",
      description: "List the signed-in user's resumes from the database. Use for requests like 'show my resumes'.",
      inputSchema: limitInputSchema,
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (!context.userId) {
          throw new Error(ASSISTANT_SIGN_IN_REPLY);
        }

        const rows = (await context.db.resume.findMany({
          where: { userId: context.userId },
          select: { id: true, public: true, title: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: readLimit(5),
        })) as ResumeListRow[];

        return createCollectionEnvelope(
          "resume",
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled resume",
            updatedAt: row.updatedAt.toISOString(),
            visibility: row.public ? "public" : "private",
          })),
          `Recent resumes for the current user (up to ${readLimit(5)}).`,
        );
      },
    }),
    listMyRecentDrafts: createTool({
      id: "listMyRecentDrafts",
      description: "List the signed-in user's private draft resumes from the database.",
      inputSchema: limitInputSchema,
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (!context.userId) {
          throw new Error(ASSISTANT_SIGN_IN_REPLY);
        }

        const rows = (await context.db.resume.findMany({
          where: {
            public: false,
            userId: context.userId,
          },
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: readLimit(5),
        })) as DraftListRow[];

        return createCollectionEnvelope(
          "draft",
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled draft",
            updatedAt: row.updatedAt.toISOString(),
          })),
          `Recent private drafts for the current user (up to ${readLimit(5)}).`,
        );
      },
    }),
    getMyOptimizationCredits: createTool({
      id: "getMyOptimizationCredits",
      description: "Read the signed-in user's current AI optimization credit balance.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () =>
        createMetricEnvelope(
          "optimization_credits",
          (await context.getOptimizationCredits()) ?? {
            dailyLimit: null,
            remainingCredits: null,
          },
          "Current AI optimization credit balance.",
        ),
    }),
    getMyCurrentModelSettings: createTool({
      id: "getMyCurrentModelSettings",
      description: "Read the signed-in user's selected AI model and available model IDs.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () =>
        createMetricEnvelope(
          "ai_model_settings",
          (await context.getCurrentModelSettings()) ?? {
            models: [],
            selectedModelId: null,
          },
          "Current selected AI model and available model IDs for the user.",
        ),
    }),
    listRegisteredUsers: createTool({
      id: "listRegisteredUsers",
      description:
        "List registered users from the database. Admin-only. Use for requests like 'show all registered users'.",
      inputSchema: limitInputSchema,
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (context.scope !== "ADMIN") {
          throw new Error(ASSISTANT_ACCESS_DENIED_REPLY);
        }

        const take = context.requestedLimit === 100 ? undefined : readLimit(20);
        const rows = (await context.db.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          ...(take ? { take } : {}),
        })) as UserListRow[];

        return createCollectionEnvelope(
          "user",
          rows.map((row) => ({
            id: row.id,
            name: row.name || "Unnamed user",
            email: row.email,
            role: row.role,
            createdAt: row.createdAt.toISOString(),
          })),
          take ? `Registered users (up to ${take}).` : "All registered users.",
        );
      },
    }),
    listRecentErrorLogs: createTool({
      id: "listRecentErrorLogs",
      description:
        "List the most recent backend error logs from the error-log system. Admin-only. Use for requests about errors.",
      inputSchema: limitInputSchema,
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (context.scope !== "ADMIN") {
          throw new Error(ASSISTANT_ACCESS_DENIED_REPLY);
        }

        const rows = (await context.db.errorLog.findMany({
          select: {
            id: true,
            endpoint: true,
            errorName: true,
            functionName: true,
            isRead: true,
            method: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: readLimit(5),
        })) as ErrorLogListRow[];

        return createCollectionEnvelope(
          "error_log",
          rows.map((row) => ({
            id: row.id,
            errorName: row.errorName,
            endpoint: row.endpoint,
            functionName: row.functionName,
            isRead: row.isRead,
            method: row.method,
            createdAt: row.createdAt.toISOString(),
          })),
          `Recent error logs (up to ${readLimit(5)}).`,
        );
      },
    }),
    listRecentAuditLogs: createTool({
      id: "listRecentAuditLogs",
      description: "List the most recent audit logs. Admin-only. Use for requests about audit activity.",
      inputSchema: limitInputSchema,
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (context.scope !== "ADMIN") {
          throw new Error(ASSISTANT_ACCESS_DENIED_REPLY);
        }

        const rows = (await context.db.auditLog.findMany({
          select: {
            id: true,
            action: true,
            category: true,
            createdAt: true,
            eventType: true,
            method: true,
            resourceType: true,
            serviceName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: readLimit(10),
        })) as AuditLogListRow[];

        return createCollectionEnvelope(
          "audit_log",
          rows.map((row) => ({
            id: row.id,
            actorEmail: row.user?.email ?? null,
            action: row.action,
            category: row.category,
            eventType: row.eventType,
            method: row.method,
            resourceType: row.resourceType,
            serviceName: row.serviceName,
            createdAt: row.createdAt.toISOString(),
          })),
          `Recent audit logs (up to ${readLimit(10)}).`,
        );
      },
    }),
    getAnalyticsSummary: createTool({
      id: "getAnalyticsSummary",
      description: "Read the admin analytics summary from database-backed analytics events. Admin-only.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (context.scope !== "ADMIN") {
          throw new Error(ASSISTANT_ACCESS_DENIED_REPLY);
        }

        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [requestCount, errorCount, activeUsers] = await Promise.all([
          context.db.analyticsEvent.count({ where: { createdAt: { gte: since }, source: "API_REQUEST" } }),
          context.db.analyticsEvent.count({
            where: {
              createdAt: { gte: since },
              source: "API_REQUEST",
              statusCode: { gte: 400 },
            },
          }),
          context.db.analyticsEvent.findMany({
            where: {
              createdAt: { gte: since },
              source: "API_REQUEST",
              userId: { not: null },
            },
            distinct: ["userId"],
            select: { userId: true },
          }),
        ]);
        const activeUserRows = activeUsers as AnalyticsActiveUserRow[];

        return createMetricEnvelope(
          "analytics_summary",
          {
            timeframeDays: 7,
            requestCount,
            errorCount,
            activeUsers: activeUserRows.length,
          },
          "Analytics summary for the last 7 days.",
        );
      },
    }),
    getAiConfiguration: createTool({
      id: "getAiConfiguration",
      description:
        "Read the real AI configuration stored in SystemConfiguration.AI_CONFIG. Admin-only. Never invent provider fields.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        if (context.scope !== "ADMIN") {
          throw new Error(ASSISTANT_ACCESS_DENIED_REPLY);
        }

        const config = await context.getAiConfiguration();

        return createMetricEnvelope(
          "ai_configuration",
          {
            PROMPT_VERSION: config.PROMPT_VERSION,
            DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: config.DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT,
            ASSISTANT_MAX_STEPS: config.ASSISTANT_MAX_STEPS,
            ASSISTANT_HISTORY_LIMIT: config.ASSISTANT_HISTORY_LIMIT,
            ASSISTANT_SYSTEM_PROMPT: config.ASSISTANT_SYSTEM_PROMPT,
            COPILOT_SYSTEM_PROMPT: config.COPILOT_SYSTEM_PROMPT,
            OPTIMIZE_SYSTEM_PROMPT: config.OPTIMIZE_SYSTEM_PROMPT,
          },
          "AI configuration loaded from the SystemConfiguration table.",
        );
      },
    }),
  } as const;
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bid\b/gi, "ID")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bapi\b/gi, "API")
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "string") {
    return compactText(value, 220);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return compactText(value.map((item) => formatValue(item)).join(", "), 220);
  }

  if (typeof value === "object") {
    return compactText(JSON.stringify(value), 220);
  }

  return compactText(String(value), 220);
}

function prioritizeEntries(record: Record<string, unknown>) {
  const priorityOrder = [
    "title",
    "name",
    "email",
    "role",
    "errorName",
    "action",
    "eventType",
    "resourceType",
    "selectedModelId",
    "requestCount",
    "errorCount",
    "activeUsers",
    "createdAt",
    "updatedAt",
  ];

  return Object.entries(record).sort((left, right) => {
    const leftIndex = priorityOrder.indexOf(left[0]);
    const rightIndex = priorityOrder.indexOf(right[0]);

    if (leftIndex === -1 && rightIndex === -1) {
      return left[0].localeCompare(right[0]);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

function formatCompactRecord(record: Record<string, unknown>, omitIds = true): string {
  const parts = prioritizeEntries(record)
    .filter(([key, value]) => value !== null && value !== undefined && (!omitIds || !/(^id$|Id$)/.test(key)))
    .slice(0, 4)
    .map(([key, value]) => `${humanizeKey(key)}: ${formatValue(value)}`);

  return parts.length > 0 ? parts.join(", ") : "No details";
}

export function renderToolEnvelopeReply(result: unknown): string {
  const parsed = assistantToolEnvelopeSchema.safeParse(result);
  if (!parsed.success) {
    return ASSISTANT_SAFE_RETRIEVAL_REPLY;
  }

  const envelope = parsed.data as AssistantToolEnvelope;

  if (envelope.type === "collection") {
    if (envelope.items.length === 0) {
      return `${envelope.summary}\n\nNo records found.`;
    }

    const previewItems = envelope.items.slice(0, 10).map((item) => `- ${formatCompactRecord(item)}`);
    const overflow =
      envelope.items.length > previewItems.length
        ? `\n\nShowing first ${previewItems.length} of ${envelope.items.length}.`
        : "";

    return `${envelope.summary}\n\n${previewItems.join("\n")}${overflow}`.trim();
  }

  if (envelope.type === "detail") {
    const lines = prioritizeEntries(envelope.item)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `- ${humanizeKey(key)}: ${formatValue(value)}`);

    return `${envelope.summary}\n\n${lines.join("\n")}`.trim();
  }

  const lines = prioritizeEntries(envelope.data)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `- ${humanizeKey(key)}: ${formatValue(value)}`);

  return `${envelope.summary}\n\n${lines.join("\n")}`.trim();
}

function buildRequestContext(options: AssistantAgentRunOptions, requestedLimit: number | null) {
  return new RequestContext<AssistantAgentContext>([
    ["currentPath", options.currentPath],
    ["db", options.db],
    ["getAiConfiguration", options.getAiConfiguration],
    ["getCurrentModelSettings", options.getCurrentModelSettings],
    ["getOptimizationCredits", options.getOptimizationCredits],
    ["latestUserMessage", options.latestUserMessage],
    ["modelId", options.modelId],
    ["requestedLimit", requestedLimit],
    ["scope", options.scope],
    ["systemPrompt", options.systemPrompt],
    ["userId", options.userId],
  ]);
}

function buildAssistantToolInput(requestedLimit: number | null): { limit?: number } {
  return requestedLimit ? { limit: requestedLimit } : {};
}

async function executeAssistantTool(
  options: AssistantAgentRunOptions,
  toolName: AssistantToolName,
  requestedLimit: number | null,
): Promise<{ reply: string; toolNames: string[] }> {
  const toolContext = buildRequestContext(options, requestedLimit).all as AssistantAgentContext;
  const tool = createAssistantTools(toolContext)[toolName];

  if (!tool.execute) {
    return {
      reply: ASSISTANT_SAFE_RETRIEVAL_REPLY,
      toolNames: [toolName],
    };
  }

  try {
    const result = await tool.execute(buildAssistantToolInput(requestedLimit) as never, {} as never);
    const parsedResult = assistantToolEnvelopeSchema.safeParse(result);

    if (!parsedResult.success) {
      return {
        reply: ASSISTANT_SAFE_RETRIEVAL_REPLY,
        toolNames: [toolName],
      };
    }

    return {
      reply: renderToolEnvelopeReply(parsedResult.data),
      toolNames: [toolName],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (message === ASSISTANT_ACCESS_DENIED_REPLY || message === ASSISTANT_SIGN_IN_REPLY) {
      return {
        reply: message,
        toolNames: [toolName],
      };
    }

    return {
      reply: ASSISTANT_SAFE_RETRIEVAL_REPLY,
      toolNames: [toolName],
    };
  }
}

function toMastraMessageInput(history: AssistantChatMessage[]): string[] {
  return history.map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`);
}

export async function runMastraAssistantChat(
  options: AssistantAgentRunOptions,
  dependencies?: AssistantRunDependencies,
): Promise<{ reply: string; toolNames: string[] }> {
  const strategy = resolveAssistantExecutionStrategy({
    message: options.latestUserMessage,
    scope: options.scope,
    userId: options.userId,
  });

  if (strategy.mode === "direct-reply" || strategy.mode === "sign-in-required" || strategy.mode === "access-denied") {
    return {
      reply: strategy.reply,
      toolNames: [],
    };
  }

  if (strategy.mode === "forced-tool") {
    return executeAssistantTool(options, strategy.toolName, strategy.requestedLimit);
  }

  const requestContext = buildRequestContext(options, strategy.requestedLimit);
  const generate =
    dependencies?.generate ??
    (async (messages, agentOptions) => {
      const result = await assistantTextAgent.generate(toMastraMessageInput(messages), agentOptions);

      return {
        text: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };
    });

  const generation = await generate(options.history, {
    requestContext,
    maxSteps: 1,
    modelSettings: {
      temperature: 0,
    },
  });

  const toolNames = generation.toolCalls.map((toolCall) => toolCall.payload.toolName);

  const text = generation.text.trim();

  return {
    reply: text.length > 0 ? text : ASSISTANT_SAFE_RETRIEVAL_REPLY,
    toolNames,
  };
}

export { resolveAssistantExecutionStrategy };
