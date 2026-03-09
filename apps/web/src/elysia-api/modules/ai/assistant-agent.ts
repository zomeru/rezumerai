import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { createTool } from "@mastra/core/tools";
import type { PrismaClient } from "@rezumerai/database";
import {
  type AiConfiguration,
  type AssistantChatMessage,
  type AssistantRoleScope,
  ContentPageSchema,
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CONTACT_CONTENT,
  DEFAULT_FAQ_CONTENT,
  DEFAULT_LANDING_PAGE_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  DEFAULT_TERMS_CONTENT,
  FaqInformationSchema,
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

type DatabaseClient = Pick<
  Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">,
  "analyticsEvent" | "auditLog" | "errorLog" | "resume" | "systemConfiguration" | "user"
>;

type AssistantToolName =
  | "getPublicAppOverview"
  | "getPublicAboutPage"
  | "getPublicContactPage"
  | "getPublicFaq"
  | "getPublicPrivacyPolicy"
  | "getPublicTermsOfService"
  | "listMyRecentResumes"
  | "listMyRecentDrafts"
  | "getMyOptimizationCredits"
  | "getMyCurrentModelSettings"
  | "listRegisteredUsers"
  | "listRecentErrorLogs"
  | "listRecentAuditLogs"
  | "getAnalyticsSummary"
  | "getAiConfiguration";

const MAX_COLLECTION_PREVIEW_ITEMS = 10;

const replyDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const publicAppOverviewSchema = z.object({
  cta: z
    .object({
      href: z.string().trim().min(1).max(200),
      label: z.string().trim().min(1).max(80),
    })
    .nullable()
    .default(null),
  features: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(260),
        title: z.string().trim().min(1).max(120),
      }),
    )
    .min(1)
    .max(8),
  summary: z.string().trim().min(1).max(600),
  title: z.string().trim().min(1).max(220),
  trustBadges: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  workflow: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(260),
        title: z.string().trim().min(1).max(120),
      }),
    )
    .max(8)
    .default([]),
});

const assistantIntentCategorySchema = z.enum(["general", "public", "user_private", "admin_private"]);
const assistantAllowedToolScopeSchema = z.enum(["none", "public", "user", "admin"]);
const assistantRequiredRoleSchema = z.union([z.literal("USER"), z.literal("ADMIN"), z.null()]);

const assistantIntentClassificationSchema = z.object({
  category: assistantIntentCategorySchema,
  requiresAuth: z.boolean(),
  requiredRole: assistantRequiredRoleSchema,
  allowedToolScope: assistantAllowedToolScopeSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(160),
});

type AssistantIntentCategory = z.infer<typeof assistantIntentCategorySchema>;
type AssistantAllowedToolScope = z.infer<typeof assistantAllowedToolScopeSchema>;
type AssistantRequiredRole = z.infer<typeof assistantRequiredRoleSchema>;
type AssistantIntentClassification = z.infer<typeof assistantIntentClassificationSchema>;

type AssistantExecutionStrategy =
  | {
      mode: "direct-reply";
      classification: AssistantIntentClassification;
      reply: string;
      requestedLimit: number | null;
    }
  | {
      mode: "sign-in-required";
      classification: AssistantIntentClassification;
      reply: string;
      requestedLimit: number | null;
    }
  | {
      mode: "access-denied";
      classification: AssistantIntentClassification;
      reply: string;
      requestedLimit: number | null;
    }
  | {
      mode: "forced-tool";
      classification: AssistantIntentClassification;
      toolName: AssistantToolName;
      requestedLimit: number | null;
    }
  | {
      mode: "model";
      classification: AssistantIntentClassification;
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
    "Never fabricate database records or system data.",
    "If a relevant application tool exists for requested information, you must not guess or invent the answer.",
    `If a database-backed or system-backed answer is unavailable, reply exactly: "${ASSISTANT_SAFE_RETRIEVAL_REPLY}"`,
    "Never invent users, resumes, system configuration, analytics, audit logs, error logs, or account data.",
    "For greetings or normal product questions, answer briefly and naturally.",
    "Do not echo raw field names, database keys, or JSON-style labels in user-facing replies.",
    "Transform structured data into short paragraphs, readable sections, and bullet lists when helpful.",
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

function createContentPageEnvelope(
  entity: string,
  summary: string,
  page: z.infer<typeof ContentPageSchema>,
): AssistantToolDetailEnvelope {
  return createDetailEnvelope(entity, page, summary);
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

function createIntentClassification(input: {
  allowedToolScope: AssistantAllowedToolScope;
  category: AssistantIntentCategory;
  confidence: number;
  reason: string;
  requiredRole: AssistantRequiredRole;
  requiresAuth: boolean;
}): AssistantIntentClassification {
  return assistantIntentClassificationSchema.parse(input);
}

function hasWord(normalized: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(normalized);
}

function hasAnyWord(normalized: string, words: string[]): boolean {
  return words.some((word) => hasWord(normalized, word));
}

function isPublicPrivacyRequest(normalized: string): boolean {
  return (
    /\b(privacy policy|website privacy|site privacy|privacy notice)\b/.test(normalized) ||
    (hasWord(normalized, "privacy") && hasAnyWord(normalized, ["policy", "website", "site", "app"]))
  );
}

function isPublicTermsRequest(normalized: string): boolean {
  return (
    /\b(terms of service|website tos|website terms|site terms|\btos\b)\b/.test(normalized) ||
    (hasWord(normalized, "terms") && hasAnyWord(normalized, ["service", "website", "site", "app"]))
  );
}

function isPublicFaqRequest(normalized: string): boolean {
  return /\b(faq|frequently asked questions|help center|help docs)\b/.test(normalized);
}

function isPublicAboutRequest(normalized: string): boolean {
  return (
    /\b(about rezumerai|about page|about this app|about your app|who are you)\b/.test(normalized) ||
    (hasWord(normalized, "about") && hasAnyWord(normalized, ["rezumerai", "company", "team", "app"]))
  );
}

function isPublicContactRequest(normalized: string): boolean {
  return (
    /\b(contact page|contact info|support email|how do i contact|how can i contact)\b/.test(normalized) ||
    (hasAnyWord(normalized, ["contact", "support"]) && hasAnyWord(normalized, ["email", "page", "info", "reach"]))
  );
}

function isPublicOverviewRequest(normalized: string): boolean {
  return /\b(what does this app do|what is rezumerai|what can this app do|what can rezumerai do|features|resume copilot)\b/.test(
    normalized,
  );
}

function isUserResumeRequest(normalized: string): boolean {
  return (
    /\b(my resumes?|my resume list|show my resumes?|list my resumes?)\b/.test(normalized) ||
    (hasWord(normalized, "my") && hasAnyWord(normalized, ["resume", "resumes"]))
  );
}

function isUserDraftRequest(normalized: string): boolean {
  return (
    /\b(my drafts?|show my drafts?|list my drafts?)\b/.test(normalized) ||
    (hasWord(normalized, "my") && hasAnyWord(normalized, ["draft", "drafts"]))
  );
}

function isUserCreditsRequest(normalized: string): boolean {
  return /\b(my credits?|remaining credits|credits do i have)\b/.test(normalized);
}

function isUserModelRequest(normalized: string): boolean {
  return /\b(current model|selected model|model settings?)\b/.test(normalized);
}

function isAdminConfigurationRequest(normalized: string): boolean {
  return /\b(ai[_\s-]*config|ai configuration|system configuration|system config|configuration)\b/.test(normalized);
}

function isAdminErrorRequest(normalized: string): boolean {
  return /\b(error|errors|error log|error logs)\b/.test(normalized) && !/\baudit\b/.test(normalized);
}

function isAdminAuditRequest(normalized: string): boolean {
  return /\baudit log|audit logs\b/.test(normalized);
}

function isAdminAnalyticsRequest(normalized: string): boolean {
  return /\banalytics|error rate|request count|active users\b/.test(normalized);
}

function isAdminUsersRequest(normalized: string): boolean {
  return (
    /\b(registered users|all users|list users|show users|user accounts|registered user)\b/.test(normalized) ||
    (hasAnyWord(normalized, ["user", "users"]) &&
      hasAnyWord(normalized, ["registered", "registration", "account", "accounts", "website", "site", "app", "all"]))
  );
}

export function classifyAssistantIntent(message: string): AssistantIntentClassification {
  const normalized = message.trim().toLowerCase();

  if (
    isPublicPrivacyRequest(normalized) ||
    isPublicTermsRequest(normalized) ||
    isPublicFaqRequest(normalized) ||
    isPublicAboutRequest(normalized) ||
    isPublicContactRequest(normalized) ||
    isPublicOverviewRequest(normalized)
  ) {
    return createIntentClassification({
      category: "public",
      requiresAuth: false,
      requiredRole: null,
      allowedToolScope: "public",
      confidence: 0.98,
      reason: "Asked for public RezumerAI site content or public product information.",
    });
  }

  if (
    isUserResumeRequest(normalized) ||
    isUserDraftRequest(normalized) ||
    isUserCreditsRequest(normalized) ||
    isUserModelRequest(normalized)
  ) {
    return createIntentClassification({
      category: "user_private",
      requiresAuth: true,
      requiredRole: "USER",
      allowedToolScope: "user",
      confidence: 0.98,
      reason: "Asked for the current user's private account or resume data.",
    });
  }

  if (
    isAdminConfigurationRequest(normalized) ||
    isAdminErrorRequest(normalized) ||
    isAdminAuditRequest(normalized) ||
    isAdminAnalyticsRequest(normalized) ||
    isAdminUsersRequest(normalized)
  ) {
    return createIntentClassification({
      category: "admin_private",
      requiresAuth: true,
      requiredRole: "ADMIN",
      allowedToolScope: "admin",
      confidence: 0.99,
      reason: "Asked for admin-only operational, configuration, analytics, or system data.",
    });
  }

  return createIntentClassification({
    category: "general",
    requiresAuth: false,
    requiredRole: null,
    allowedToolScope: "none",
    confidence: isSimpleGreeting(message) ? 0.99 : 0.9,
    reason: isSimpleGreeting(message)
      ? "Simple greeting or casual conversation."
      : "General prompt that does not require application data access.",
  });
}

function resolvePublicToolName(message: string): AssistantToolName {
  const normalized = message.trim().toLowerCase();

  if (isPublicPrivacyRequest(normalized)) {
    return "getPublicPrivacyPolicy";
  }

  if (isPublicTermsRequest(normalized)) {
    return "getPublicTermsOfService";
  }

  if (isPublicFaqRequest(normalized) || /\bhow does resume copilot work\b/.test(normalized)) {
    return "getPublicFaq";
  }

  if (isPublicAboutRequest(normalized)) {
    return "getPublicAboutPage";
  }

  if (isPublicContactRequest(normalized)) {
    return "getPublicContactPage";
  }

  return "getPublicAppOverview";
}

function resolveUserToolName(message: string): AssistantToolName | null {
  const normalized = message.trim().toLowerCase();

  if (isUserResumeRequest(normalized)) {
    return "listMyRecentResumes";
  }

  if (isUserDraftRequest(normalized)) {
    return "listMyRecentDrafts";
  }

  if (isUserCreditsRequest(normalized)) {
    return "getMyOptimizationCredits";
  }

  if (isUserModelRequest(normalized)) {
    return "getMyCurrentModelSettings";
  }

  return null;
}

function resolveAdminToolName(message: string): AssistantToolName | null {
  const normalized = message.trim().toLowerCase();

  if (isAdminConfigurationRequest(normalized)) {
    return "getAiConfiguration";
  }

  if (isAdminErrorRequest(normalized)) {
    return "listRecentErrorLogs";
  }

  if (isAdminAuditRequest(normalized)) {
    return "listRecentAuditLogs";
  }

  if (isAdminAnalyticsRequest(normalized)) {
    return "getAnalyticsSummary";
  }

  if (isAdminUsersRequest(normalized)) {
    return "listRegisteredUsers";
  }

  return null;
}

function resolveAssistantExecutionStrategy(options: {
  message: string;
  scope: AssistantRoleScope;
  userId: string | null;
}): AssistantExecutionStrategy {
  const { message, scope, userId } = options;
  const requestedLimit = extractRequestedLimit(message);
  const classification = classifyAssistantIntent(message);

  if (classification.category === "general" && isSimpleGreeting(message)) {
    return {
      mode: "direct-reply",
      classification,
      reply: ASSISTANT_GREETING_REPLY,
      requestedLimit,
    };
  }

  if (classification.category === "user_private" && !userId) {
    return {
      mode: "sign-in-required",
      classification,
      reply: ASSISTANT_SIGN_IN_REPLY,
      requestedLimit,
    };
  }

  if (classification.category === "admin_private" && scope !== "ADMIN") {
    return {
      mode: "access-denied",
      classification,
      reply: ASSISTANT_ACCESS_DENIED_REPLY,
      requestedLimit,
    };
  }

  if (classification.category === "public") {
    return {
      mode: "forced-tool",
      classification,
      toolName: resolvePublicToolName(message),
      requestedLimit,
    };
  }

  if (classification.category === "user_private") {
    const toolName = resolveUserToolName(message);

    return {
      mode: "forced-tool",
      classification,
      toolName: toolName ?? "listMyRecentResumes",
      requestedLimit,
    };
  }

  if (classification.category === "admin_private") {
    const toolName = resolveAdminToolName(message);

    return {
      mode: "forced-tool",
      classification,
      toolName: toolName ?? "getAiConfiguration",
      requestedLimit,
    };
  }

  return {
    mode: "model",
    classification,
    requestedLimit,
  };
}

function createAssistantTools(context: AssistantAgentContext) {
  const readLimit = (fallback: number): number => clampRequestedLimit(context.requestedLimit, fallback);

  return {
    getPublicAppOverview: createTool({
      id: "getPublicAppOverview",
      description:
        "Retrieves public Rezumerai app and marketing information from stored public site content. Use this for public product questions. Do not invent product details yourself.",
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
            cta: {
              href: landing.ctaSection.primaryCtaHref,
              label: landing.ctaSection.primaryCtaLabel,
            },
            features: landing.featureSection.items.map((item) => ({
              description: item.description,
              title: item.title,
            })),
            title: landing.hero.title,
            summary: landing.hero.description,
            trustBadges: landing.hero.trustBadges,
            workflow: landing.workflowSection.items.map((item) => ({
              description: item.description,
              title: item.title,
            })),
          },
          "Grounded public overview of Rezumerai.",
        );
      },
    }),
    getPublicAboutPage: createTool({
      id: "getPublicAboutPage",
      description: "Read the public About page from stored public site content.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        const storedAbout = await context.db.systemConfiguration.findUnique({
          where: { name: SYSTEM_CONFIGURATION_KEYS.ABOUT_US_INFORMATION },
          select: { value: true },
        });
        const parsedAbout = ContentPageSchema.safeParse(storedAbout?.value);
        const about = parsedAbout.success ? parsedAbout.data : DEFAULT_ABOUT_CONTENT;

        return createContentPageEnvelope("about_page", "Public About page.", about);
      },
    }),
    getPublicContactPage: createTool({
      id: "getPublicContactPage",
      description: "Read the public Contact page from stored public site content.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        const storedContact = await context.db.systemConfiguration.findUnique({
          where: { name: SYSTEM_CONFIGURATION_KEYS.CONTACT_INFORMATION },
          select: { value: true },
        });
        const parsedContact = ContentPageSchema.safeParse(storedContact?.value);
        const contact = parsedContact.success ? parsedContact.data : DEFAULT_CONTACT_CONTENT;

        return createContentPageEnvelope("contact_page", "Public Contact page.", contact);
      },
    }),
    getPublicFaq: createTool({
      id: "getPublicFaq",
      description:
        "Retrieves the public FAQ from stored site content. This tool must be used for FAQ-style public help questions. Do not invent FAQ answers yourself.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        const storedFaq = await context.db.systemConfiguration.findUnique({
          where: { name: SYSTEM_CONFIGURATION_KEYS.FAQ_INFORMATION },
          select: { value: true },
        });
        const parsedFaq = FaqInformationSchema.safeParse(storedFaq?.value);
        const faq = parsedFaq.success ? parsedFaq.data : DEFAULT_FAQ_CONTENT;

        return createDetailEnvelope("faq", faq, "Public FAQ content.");
      },
    }),
    getPublicPrivacyPolicy: createTool({
      id: "getPublicPrivacyPolicy",
      description: "Read the public website privacy policy from stored public site content.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        const storedPolicy = await context.db.systemConfiguration.findUnique({
          where: { name: SYSTEM_CONFIGURATION_KEYS.PRIVACY_POLICY_INFORMATION },
          select: { value: true },
        });
        const parsedPolicy = ContentPageSchema.safeParse(storedPolicy?.value);
        const policy = parsedPolicy.success ? parsedPolicy.data : DEFAULT_PRIVACY_CONTENT;

        return createContentPageEnvelope("privacy_policy", "Public website privacy policy.", policy);
      },
    }),
    getPublicTermsOfService: createTool({
      id: "getPublicTermsOfService",
      description: "Read the public website terms of service from stored public site content.",
      inputSchema: z.object({}),
      outputSchema: assistantToolEnvelopeSchema,
      execute: async () => {
        const storedTerms = await context.db.systemConfiguration.findUnique({
          where: { name: SYSTEM_CONFIGURATION_KEYS.TOS_INFORMATION },
          select: { value: true },
        });
        const parsedTerms = ContentPageSchema.safeParse(storedTerms?.value);
        const terms = parsedTerms.success ? parsedTerms.data : DEFAULT_TERMS_CONTENT;

        return createContentPageEnvelope("terms_of_service", "Public website terms of service.", terms);
      },
    }),
    listMyRecentResumes: createTool({
      id: "listMyRecentResumes",
      description:
        "Retrieves the signed-in user's resumes from the database. This tool must be used whenever someone asks for their resumes. Do not generate resume records yourself.",
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
      description:
        "Retrieves the signed-in user's current AI optimization credit balance from backend data. This tool must be used for credit balance requests. Do not invent credit values.",
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
        "Retrieves registered users from the database. Admin-only. This tool must be used whenever someone asks for registered users. Do not generate user records yourself.",
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
        "Retrieves the most recent backend error logs from the error-log system. Admin-only. This tool must be used for error-log requests. Do not invent error records.",
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
      description:
        "Retrieves the most recent audit logs from the database. Admin-only. This tool must be used for audit-log requests. Do not invent audit records.",
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
      description:
        "Retrieves the admin analytics summary from database-backed analytics events. Admin-only. This tool must be used for analytics requests. Do not invent analytics data.",
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
        "Retrieves the real AI configuration stored in SystemConfiguration.AI_CONFIG. Admin-only. This tool must be used for AI/system configuration requests. Do not invent configuration fields.",
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
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\bid\b/g, "ID")
    .replace(/\bai\b/g, "AI")
    .replace(/\bapi\b/g, "API")
    .trim();

  return normalized.length > 0 ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function joinReplySections(sections: Array<string | null | undefined | false>): string {
  return sections
    .map((section) => (typeof section === "string" ? section.trim() : ""))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function toBulletList(items: Array<string | null | undefined | false>): string {
  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}

function toOrderedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatReplyDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : replyDateFormatter.format(parsed);
}

function formatPreviewOverflow(total: number, shown: number): string | null {
  return total > shown ? `Showing first ${shown} of ${total}.` : null;
}

function formatResumeLine(item: Record<string, unknown>, fallbackLabel: string): string {
  const title = typeof item.title === "string" && item.title.trim().length > 0 ? item.title : fallbackLabel;
  const details = [
    formatReplyDate(item.updatedAt) ? `Updated ${formatReplyDate(item.updatedAt)}.` : null,
    typeof item.visibility === "string" && item.visibility.length > 0 ? `Visibility: ${item.visibility}.` : null,
  ].filter(Boolean);

  return `**${title}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
}

function renderCollectionReply(
  envelope: Extract<AssistantToolEnvelope, { type: "collection" }>,
  options: {
    emptyMessage: string;
    intro: string;
    renderItem: (item: Record<string, unknown>) => string;
  },
): string {
  if (envelope.items.length === 0) {
    return options.emptyMessage;
  }

  const previewItems = envelope.items.slice(0, MAX_COLLECTION_PREVIEW_ITEMS);

  return joinReplySections([
    options.intro,
    toBulletList(previewItems.map((item) => options.renderItem(item))),
    formatPreviewOverflow(envelope.items.length, previewItems.length),
  ]);
}

function renderContentPageReply(item: Record<string, unknown>): string | null {
  const parsed = ContentPageSchema.safeParse(item);
  if (!parsed.success) {
    return null;
  }

  const page = parsed.data;

  return joinReplySections([
    `**${page.title}**`,
    page.summary,
    `Last updated: ${page.lastUpdated}.`,
    ...page.sections.map((section) =>
      joinReplySections([
        `**${section.heading}**`,
        ...section.paragraphs,
        section.bullets.length > 0 ? toBulletList(section.bullets) : null,
      ]),
    ),
    ...page.cards.map((card) =>
      joinReplySections([
        `**${card.title}**`,
        card.description,
        card.items.length > 0 ? toBulletList(card.items) : null,
      ]),
    ),
    page.cta ? `Next step: ${page.cta.label} (${page.cta.href}).` : null,
  ]);
}

function renderFaqReply(item: Record<string, unknown>): string | null {
  const parsed = FaqInformationSchema.safeParse(item);
  if (!parsed.success) {
    return null;
  }

  const faq = parsed.data;

  return joinReplySections([
    `**${faq.title}**`,
    faq.summary,
    ...faq.categories.map((category) =>
      joinReplySections([
        `**${category.title}**`,
        toOrderedList(category.items.map((entry) => `**${entry.question}** ${entry.answer}`)),
      ]),
    ),
  ]);
}

function renderPublicAppOverviewReply(item: Record<string, unknown>): string | null {
  const parsed = publicAppOverviewSchema.safeParse(item);
  if (!parsed.success) {
    return null;
  }

  const overview = parsed.data;

  return joinReplySections([
    overview.summary,
    overview.features.length > 0
      ? joinReplySections([
          "Here are some of its key features:",
          toBulletList(overview.features.map((feature) => `**${feature.title}** ${feature.description}`)),
        ])
      : null,
    overview.trustBadges.length > 0
      ? joinReplySections(["Additional benefits include:", toBulletList(overview.trustBadges)])
      : null,
    overview.workflow.length > 0
      ? joinReplySections([
          "Typical workflow:",
          toBulletList(overview.workflow.map((step) => `**${step.title}** ${step.description}`)),
        ])
      : null,
    overview.cta ? `Next step: ${overview.cta.label} (${overview.cta.href}).` : null,
  ]);
}

function renderMetricReply(envelope: Extract<AssistantToolEnvelope, { type: "metric" }>): string | null {
  if (envelope.entity === "optimization_credits") {
    const remainingCredits = typeof envelope.data.remainingCredits === "number" ? envelope.data.remainingCredits : null;
    const dailyLimit = typeof envelope.data.dailyLimit === "number" ? envelope.data.dailyLimit : null;

    if (remainingCredits !== null && dailyLimit !== null) {
      return `You have ${remainingCredits} of ${dailyLimit} AI optimization credits remaining today.`;
    }
  }

  if (envelope.entity === "ai_model_settings") {
    const selectedModelId =
      typeof envelope.data.selectedModelId === "string" && envelope.data.selectedModelId.trim().length > 0
        ? envelope.data.selectedModelId
        : null;
    const models = Array.isArray(envelope.data.models)
      ? envelope.data.models.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    return joinReplySections([
      selectedModelId ? `Your current AI model is **${selectedModelId}**.` : "You have not selected an AI model yet.",
      models.length > 0 ? joinReplySections(["Available models:", toBulletList(models)]) : null,
    ]);
  }

  if (envelope.entity === "analytics_summary") {
    const timeframeDays = typeof envelope.data.timeframeDays === "number" ? envelope.data.timeframeDays : null;
    const requestCount = typeof envelope.data.requestCount === "number" ? envelope.data.requestCount : null;
    const errorCount = typeof envelope.data.errorCount === "number" ? envelope.data.errorCount : null;
    const activeUsers = typeof envelope.data.activeUsers === "number" ? envelope.data.activeUsers : null;

    if (timeframeDays !== null && requestCount !== null && errorCount !== null && activeUsers !== null) {
      return `In the last ${timeframeDays} days, Rezumerai recorded ${requestCount} API requests, ${errorCount} error responses, and ${activeUsers} active signed-in users.`;
    }
  }

  if (envelope.entity === "ai_configuration") {
    const labels: Record<string, string> = {
      ASSISTANT_CONTEXT_TOKEN_LIMIT: "Assistant context token limit",
      ASSISTANT_HISTORY_LIMIT: "Assistant history limit",
      ASSISTANT_MAX_STEPS: "Assistant max steps",
      ASSISTANT_RAG_ENABLED: "Assistant RAG enabled",
      ASSISTANT_RAG_RECENT_LIMIT: "Assistant RAG recent limit",
      ASSISTANT_RAG_TOP_K: "Assistant RAG top K",
      ASSISTANT_SYSTEM_PROMPT: "Assistant system prompt",
      COPILOT_SYSTEM_PROMPT: "Copilot system prompt",
      DAILY_AI_TEXT_OPTIMIZER_CREDIT_LIMIT: "Daily optimizer credit limit",
      EMBEDDING_DIMENSIONS: "Embedding dimensions",
      EMBEDDING_MODEL: "Embedding model",
      EMBEDDING_PROVIDER: "Embedding provider",
      OPTIMIZE_SYSTEM_PROMPT: "Optimize system prompt",
      PROMPT_VERSION: "Prompt version",
    };

    const items = Object.entries(labels)
      .map(([key, label]) => {
        const value = envelope.data[key];

        return value === null || value === undefined ? null : `**${label}:** ${formatValue(value)}`;
      })
      .filter((value): value is string => Boolean(value));

    return joinReplySections([
      "Here is the current AI configuration used by the app.",
      items.length > 0 ? toBulletList(items) : null,
    ]);
  }

  return null;
}

function renderDetailReply(envelope: Extract<AssistantToolEnvelope, { type: "detail" }>): string | null {
  if (envelope.entity === "public_app_overview") {
    return renderPublicAppOverviewReply(envelope.item);
  }

  if (envelope.entity === "faq") {
    return renderFaqReply(envelope.item);
  }

  if (
    envelope.entity === "about_page" ||
    envelope.entity === "contact_page" ||
    envelope.entity === "privacy_policy" ||
    envelope.entity === "terms_of_service"
  ) {
    return renderContentPageReply(envelope.item);
  }

  return null;
}

function renderEntityCollectionReply(envelope: Extract<AssistantToolEnvelope, { type: "collection" }>): string | null {
  if (envelope.entity === "resume") {
    return renderCollectionReply(envelope, {
      emptyMessage: "You do not have any resumes yet.",
      intro: "Here are your most recent resumes.",
      renderItem: (item) => formatResumeLine(item, "Untitled resume"),
    });
  }

  if (envelope.entity === "draft") {
    return renderCollectionReply(envelope, {
      emptyMessage: "You do not have any drafts yet.",
      intro: "Here are your most recent private drafts.",
      renderItem: (item) => formatResumeLine(item, "Untitled draft"),
    });
  }

  if (envelope.entity === "user") {
    return renderCollectionReply(envelope, {
      emptyMessage: "No registered users were found.",
      intro: "Here are the most recent registered users.",
      renderItem: (item) => {
        const name = typeof item.name === "string" && item.name.trim().length > 0 ? item.name : "Unnamed user";
        const details = [
          typeof item.email === "string" ? item.email : null,
          typeof item.role === "string" ? `Role: ${item.role}.` : null,
          formatReplyDate(item.createdAt) ? `Joined ${formatReplyDate(item.createdAt)}.` : null,
        ].filter(Boolean);

        return `**${name}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
      },
    });
  }

  if (envelope.entity === "error_log") {
    return renderCollectionReply(envelope, {
      emptyMessage: "No recent error logs were found.",
      intro: "Here are the most recent error logs.",
      renderItem: (item) => {
        const errorName =
          typeof item.errorName === "string" && item.errorName.trim().length > 0 ? item.errorName : "Unknown error";
        const details = [
          typeof item.method === "string" && typeof item.endpoint === "string"
            ? `${item.method} ${item.endpoint}.`
            : typeof item.endpoint === "string" && item.endpoint.trim().length > 0
              ? `${item.endpoint}.`
              : null,
          typeof item.functionName === "string" && item.functionName.trim().length > 0
            ? `Function: ${item.functionName}.`
            : null,
          typeof item.isRead === "boolean" ? `Status: ${item.isRead ? "read" : "unread"}.` : null,
          formatReplyDate(item.createdAt) ? `Logged ${formatReplyDate(item.createdAt)}.` : null,
        ].filter(Boolean);

        return `**${errorName}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
      },
    });
  }

  if (envelope.entity === "audit_log") {
    return renderCollectionReply(envelope, {
      emptyMessage: "No recent audit logs were found.",
      intro: "Here are the most recent audit log entries.",
      renderItem: (item) => {
        const action = typeof item.action === "string" && item.action.trim().length > 0 ? item.action : "Activity";
        const details = [
          typeof item.eventType === "string" ? item.eventType : null,
          typeof item.resourceType === "string" && item.resourceType.trim().length > 0
            ? `Resource: ${item.resourceType}.`
            : null,
          typeof item.actorEmail === "string" && item.actorEmail.trim().length > 0
            ? `Actor: ${item.actorEmail}.`
            : null,
          formatReplyDate(item.createdAt) ? `Logged ${formatReplyDate(item.createdAt)}.` : null,
        ].filter(Boolean);

        return `**${action}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
      },
    });
  }

  return null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "string") {
    const formattedDate = formatReplyDate(value);

    if (formattedDate) {
      return formattedDate;
    }

    return compactText(value, 220);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
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
    return (
      renderEntityCollectionReply(envelope) ??
      (envelope.items.length === 0
        ? joinReplySections([envelope.summary, "No records found."])
        : joinReplySections([
            envelope.summary,
            toBulletList(
              envelope.items
                .slice(0, MAX_COLLECTION_PREVIEW_ITEMS)
                .map((item) => (isRecord(item) ? formatCompactRecord(item) : formatValue(item))),
            ),
            formatPreviewOverflow(envelope.items.length, Math.min(envelope.items.length, MAX_COLLECTION_PREVIEW_ITEMS)),
          ]))
    );
  }

  if (envelope.type === "detail") {
    return (
      renderDetailReply(envelope) ??
      joinReplySections([
        envelope.summary,
        toBulletList(
          prioritizeEntries(envelope.item)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `**${humanizeKey(key)}:** ${formatValue(value)}`),
        ),
      ])
    );
  }

  return (
    renderMetricReply(envelope) ??
    joinReplySections([
      envelope.summary,
      toBulletList(
        prioritizeEntries(envelope.data)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => `**${humanizeKey(key)}:** ${formatValue(value)}`),
      ),
    ])
  );
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
