import { treaty } from "@elysiajs/eden";
import type { elysiaApp } from "@/elysia-api/app";
import { clientEnv } from "@/env";

/**
 * Eden treaty client — provides end-to-end type safety inferred
 * directly from the Elysia app definition.
 *
 * Security: Uses validated environment variable for API URL.
 * Credentials are included to forward cookies (NextAuth session).
 *
 * Usage:
 *   const { data, error } = await api.profile.get()
 *   const { data, error } = await api.admin.users({ id: "1" }).get()
 */

function getApiBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_SITE_URL;
}

function createApi(options?: Parameters<typeof treaty<typeof elysiaApp>>[1]) {
  return treaty<typeof elysiaApp>(getApiBaseUrl(), options).api;
}

export const api = createApi();
export const apiWithoutDateParsing = createApi({ parseDate: false });
