import type { User } from "@rezumerai/database";
import Elysia from "elysia";
import { resolveRequestSessionUser } from "@/lib/request-auth";
import { updateRequestContext } from "../observability/request-context";
import { isAuthOptionalPath } from "./auth-paths";

/**
 * Auth plugin — validates the Better Auth session and injects the authenticated
 * user into the Elysia request context. Protected routes should `.use(authPlugin)`.
 *
 */
export async function resolveSessionUser(requestHeaders: HeadersInit): Promise<User | null> {
  return resolveRequestSessionUser(requestHeaders);
}

export const authPlugin = new Elysia({ name: "plugin/auth" })
  .derive({ as: "scoped" }, async ({ request, set }) => {
    const pathname = new URL(request.url).pathname;

    if (isAuthOptionalPath(pathname)) {
      return {
        user: null as unknown as User,
        __unauthorized: false as const,
      };
    }

    const user = await resolveSessionUser(request.headers);

    if (!user) {
      set.status = 401;
      return {
        user: null as unknown as User,
        __unauthorized: true as const,
      };
    }

    updateRequestContext({
      userId: user.id,
      userRole:
        typeof (user as { role?: unknown }).role === "string" ? String((user as { role?: unknown }).role) : null,
    });

    return { user, __unauthorized: false as const };
  })
  .onBeforeHandle({ as: "scoped" }, ({ __unauthorized, status }) => {
    if (__unauthorized) {
      return status(401, "Unauthorized - valid session required");
    }
  });
