import type { AssistantRoleScope } from "@rezumerai/types";
import type { DatabaseClient, UserRole } from "./common";

export interface AssistantToolOptions {
  db: DatabaseClient;
  scope: AssistantRoleScope;
  userId: string | null;
  role: UserRole | null;
  getOptimizationCredits: () => Promise<{
    remainingCredits: number;
    dailyLimit: number;
  } | null>;
  getCurrentModelSettings: () => Promise<{
    selectedModelId: string;
    models: string[];
  } | null>;
}

export interface CopilotToolOptions {
  db: DatabaseClient;
  userId: string;
  getOptimizationCredits: () => Promise<{
    remainingCredits: number;
    dailyLimit: number;
  }>;
}
