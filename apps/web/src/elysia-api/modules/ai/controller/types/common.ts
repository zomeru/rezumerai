import type { PrismaClient } from "@rezumerai/database";

export type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
export type TransactionCapableDatabaseClient = DatabaseClient & Pick<PrismaClient, "$transaction">;

export interface TrackAiHandledErrorOptions {
  request: Request;
  route: string;
  userId?: string | null;
  error: unknown;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  metadata?: Record<string, unknown>;
}

export interface VerifiedAiUser {
  id: string;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export interface SelectModelBody {
  modelId: string;
}

export interface OptimizeTextBody {
  prompt?: string;
  text?: string;
  resumeId?: string;
  modelId?: string;
}
