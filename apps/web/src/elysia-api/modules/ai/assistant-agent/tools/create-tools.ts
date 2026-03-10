import { createTool } from "@mastra/core/tools";
import {
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
import { ASSISTANT_ACCESS_DENIED_REPLY, ASSISTANT_SIGN_IN_REPLY } from "../constants";
import type {
  AnalyticsActiveUserRow,
  AssistantAgentContext,
  AuditLogListRow,
  DraftListRow,
  ErrorLogListRow,
  ResumeListRow,
  UserListRow,
} from "../types";
import { clampRequestedLimit } from "../utils";
import {
  assistantToolEnvelopeSchema,
  createCollectionEnvelope,
  createContentPageEnvelope,
  createDetailEnvelope,
  createMetricEnvelope,
  createPublicOverviewItem,
  limitInputSchema,
} from "./envelopes";

export function createAssistantTools(context: AssistantAgentContext) {
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
          createPublicOverviewItem(landing),
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
            createdAt: row.createdAt.toISOString(),
            endpoint: row.endpoint,
            errorName: row.errorName,
            functionName: row.functionName,
            id: row.id,
            isRead: row.isRead,
            method: row.method,
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
            action: row.action,
            actorEmail: row.user?.email ?? null,
            category: row.category,
            createdAt: row.createdAt.toISOString(),
            eventType: row.eventType,
            id: row.id,
            method: row.method,
            resourceType: row.resourceType,
            serviceName: row.serviceName,
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
