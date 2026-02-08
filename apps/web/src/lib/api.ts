import { treaty } from "@elysiajs/eden";
import type { App } from "@rezumerai/api";

const baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Eden treaty client — provides end-to-end type safety inferred
 * directly from the Elysia app definition.
 *
 * Usage:
 *   const { data, error } = await api.api.users.get()
 *   const { data, error } = await api.api.users({ id: "1" }).get()
 */
function createApi(): ReturnType<typeof treaty<App>> {
  return treaty<App>(baseUrl, {
    fetch: {
      credentials: "include", // forward cookies (NextAuth session)
    },
  });
}

export const api: ReturnType<typeof createApi> = createApi();
