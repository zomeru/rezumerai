import type { AssistantToolName } from "./tooling";

export type AssistantIntentCategory = "general" | "public" | "user_private" | "admin_private";
export type AssistantAllowedToolScope = "none" | "public" | "user" | "admin";
export type AssistantRequiredRole = "USER" | "ADMIN" | null;

export interface AssistantIntentClassification {
  allowedToolScope: AssistantAllowedToolScope;
  category: AssistantIntentCategory;
  confidence: number;
  reason: string;
  requiredRole: AssistantRequiredRole;
  requiresAuth: boolean;
}

export type AssistantExecutionStrategy =
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
