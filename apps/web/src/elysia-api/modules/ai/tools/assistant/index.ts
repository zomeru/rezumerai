import type { AssistantToolOptions } from "../types";
import { createAdminAssistantTools } from "./admin-tools";
import { createPublicAssistantTools } from "./public-tools";
import { createUserAssistantTools } from "./user-tools";

export function createAssistantTools(options: AssistantToolOptions) {
  const publicTools = createPublicAssistantTools({ db: options.db });

  if (options.scope === "PUBLIC" || !options.userId) {
    return publicTools;
  }

  const userTools = createUserAssistantTools(options);

  if (options.scope !== "ADMIN" || options.role !== "ADMIN") {
    return [...publicTools, ...userTools] as const;
  }

  const adminTools = createAdminAssistantTools(options);

  return [...publicTools, ...userTools, ...adminTools] as const;
}
