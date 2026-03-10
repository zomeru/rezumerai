import type { PrismaClient } from "@rezumerai/database";

export type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;

export type UserRole = "ADMIN" | "USER";

export type ToolEntityRecord = Record<string, unknown>;
