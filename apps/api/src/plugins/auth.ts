import type { SessionUser } from "@rezumerai/types";
import Elysia from "elysia";
import { env } from "../env";

/**
 * Auth plugin — validates the Better Auth session and injects the authenticated
 * user into the Elysia request context.
 *
 * Strategy:
 *  1. Read the session cookie from the incoming request.
 *  2. Forward it to the Better Auth session endpoint on the Next.js app.
 *  3. Attach `user` to context so downstream handlers can access it.
 *
 * Public routes should NOT use this plugin.
 * Protected routes `.use(authPlugin)` to require authentication.
 */

/**
 * Resolves the current session by forwarding cookies to the Better Auth
 * session endpoint. Keeps auth logic centralised in the Next.js app.
 */
async function resolveSession(request: Request): Promise<SessionUser | null> {
  // Strategy 1: Forward cookies to NextAuth session endpoint
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const res = await fetch(`${env.BETTER_AUTH_URL}/api/auth/get-session`, {
      headers: { cookie },
    });

    if (!res.ok) return null;

    const session = (await res.json()) as { user?: SessionUser };
    if (!session?.user?.id) return null;

    return session.user;
  } catch {
    return null;
  }
}

export const authPlugin = new Elysia({ name: "plugin/auth" })
  .derive({ as: "scoped" }, async ({ request, set }) => {
    const user = await resolveSession(request);

    if (!user) {
      set.status = 401;
      return {
        user: null as unknown as SessionUser,
        __unauthorized: true as const,
      };
    }

    return { user, __unauthorized: false as const };
  })
  .onBeforeHandle({ as: "scoped" }, ({ set, __unauthorized }) => {
    if (__unauthorized) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized — valid session required",
      };
    }
  });
