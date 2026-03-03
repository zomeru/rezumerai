import type { User } from "better-auth";
import Elysia from "elysia";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Auth plugin — validates the Better Auth session and injects the authenticated
 * user into the Elysia request context. Protected routes should `.use(authPlugin)`.
 *
 */
async function resolveSession(): Promise<User | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return session.user;
}

export const authPlugin = new Elysia({ name: "plugin/auth" })
  .derive({ as: "scoped" }, async ({ set }) => {
    const user = await resolveSession();

    if (!user) {
      set.status = 401;
      return {
        user: null as unknown as User,
        __unauthorized: true as const,
      };
    }

    return { user, __unauthorized: false as const };
  })
  .onBeforeHandle({ as: "scoped" }, ({ __unauthorized, status }) => {
    if (__unauthorized) {
      return status(401, "Unauthorized - valid session required");
    }
  });
