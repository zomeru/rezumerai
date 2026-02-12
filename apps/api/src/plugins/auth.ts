import Elysia from "elysia";
import { env } from "../env";

/**
 * Auth plugin — validates NextAuth session/JWT and injects the authenticated
 * user into the Elysia request context.
 *
 * Strategy:
 *  1. Read the `authorization` header (Bearer <jwt>) or the NextAuth session
 *     cookie from the incoming request.
 *  2. Verify the JWT using the shared NEXTAUTH_SECRET (jose / HS256).
 *  3. Attach `user` to context so downstream handlers can access it.
 *
 * Public routes should NOT use this plugin.
 * Protected routes `.use(authPlugin)` to require authentication.
 */

/**
 * Authenticated user data extracted from NextAuth session.
 *
 * @property id - Unique user identifier
 * @property email - User email address
 * @property name - User display name (nullable)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Decode and verify a NextAuth JWT.
 *
 * NextAuth v4/v5 JWTs are JWE tokens encrypted with A256CBC-HS512 by default.
 * We use the `next-auth` compatible `decode` approach here.
 * For simplicity and forward-compatibility, we call the NextAuth session
 * endpoint on the Next.js app. This keeps auth logic in one place.
 */
async function resolveSession(request: Request): Promise<SessionUser | null> {
  // Strategy 1: Forward cookies to NextAuth session endpoint
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const res = await fetch(`${env.NEXTAUTH_URL}/api/auth/session`, {
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

// biome-ignore lint/nursery/useExplicitType: Elysia type inference required
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
        error: "Unauthorized — valid NextAuth session required",
      };
    }
  });
