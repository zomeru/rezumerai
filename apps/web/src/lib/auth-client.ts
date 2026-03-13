import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env";
import {
  getSessionUserRole,
  hasRegisteredSession,
  hasSessionIdentity,
  isAnonymousSession,
  type SessionLike,
} from "./auth-session";

function getClientBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_SITE_URL;
}

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [anonymousClient()],
});

export const { changePassword, signIn, signOut, signUp, useSession } = authClient;
export { getSessionUserRole, hasRegisteredSession, hasSessionIdentity, isAnonymousSession, type SessionLike };

let pendingAnonymousSignIn: Promise<unknown> | null = null;

export function startAnonymousSession(
  signInAnonymous: (payload: Record<string, never>) => Promise<unknown> = signIn.anonymous,
): Promise<unknown> {
  return signInAnonymous({});
}

export async function ensureAnonymousSession(session: SessionLike): Promise<void> {
  if (hasSessionIdentity(session)) {
    return;
  }

  if (!pendingAnonymousSignIn) {
    pendingAnonymousSignIn = startAnonymousSession().finally(() => {
      pendingAnonymousSignIn = null;
    });
  }

  await pendingAnonymousSignIn;
}
