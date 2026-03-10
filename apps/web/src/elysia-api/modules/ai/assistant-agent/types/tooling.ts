import type { PrismaClient } from "@rezumerai/database";

export type DatabaseClient = Pick<
  Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">,
  "analyticsEvent" | "auditLog" | "errorLog" | "resume" | "systemConfiguration" | "user"
>;

export type AssistantToolName =
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

interface AssistantToolEnvelopeBase {
  entity: string;
  summary: string;
  type: "collection" | "detail" | "metric";
}

export interface AssistantToolCollectionEnvelope extends AssistantToolEnvelopeBase {
  count: number;
  items: Array<Record<string, unknown>>;
  meta: Record<string, unknown> | null;
  type: "collection";
}

export interface AssistantToolDetailEnvelope extends AssistantToolEnvelopeBase {
  item: Record<string, unknown>;
  type: "detail";
}

export interface AssistantToolMetricEnvelope extends AssistantToolEnvelopeBase {
  data: Record<string, unknown>;
  type: "metric";
}

export type AssistantToolEnvelope =
  | AssistantToolCollectionEnvelope
  | AssistantToolDetailEnvelope
  | AssistantToolMetricEnvelope;
