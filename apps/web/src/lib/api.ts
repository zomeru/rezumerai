import { treaty } from "@elysiajs/eden";
import type { App } from "@rezumerai/api";
import { clientEnv } from "@/env";

/**
 * Eden treaty client — provides end-to-end type safety inferred
 * directly from the Elysia app definition.
 *
 * Security: Uses validated environment variable for API URL.
 * Credentials are included to forward cookies (NextAuth session).
 *
 * Usage:
 *   const { data, error } = await api.api.users.get()
 *   const { data, error } = await api.api.users({ id: "1" }).get()
 */
function createApi(): ReturnType<typeof treaty<App>> {
  return treaty<App>(clientEnv.NEXT_PUBLIC_API_URL, {
    fetch: {
      credentials: "include", // Forward cookies (NextAuth session)
    },
  });
}

export const api: ReturnType<typeof createApi> = createApi();
