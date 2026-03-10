import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env";

function getClientBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_SITE_URL;
}

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [anonymousClient()],
});

export const { changePassword, signIn, signOut, signUp, useSession } = authClient;

type SessionLike = {
  user?: {
    id?: string | null;
    isAnonymous?: boolean | null;
  } | null;
} | null;

export function hasSessionIdentity(session: SessionLike): session is { user: { id: string; isAnonymous?: boolean } } {
  return typeof session?.user?.id === "string" && session.user.id.length > 0;
}

export function isAnonymousSession(session: SessionLike): boolean {
  return session?.user?.isAnonymous === true;
}

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
