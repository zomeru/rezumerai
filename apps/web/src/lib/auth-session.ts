export type SessionLike = {
  user?: {
    id?: string | null;
    isAnonymous?: boolean | null;
  } | null;
} | null;

export type SessionRole = "ADMIN" | "USER";

export function hasSessionIdentity(session: SessionLike): session is { user: { id: string; isAnonymous?: boolean } } {
  return typeof session?.user?.id === "string" && session.user.id.length > 0;
}

export function isAnonymousSession(session: SessionLike): boolean {
  return session?.user?.isAnonymous === true;
}

export function hasRegisteredSession(session: SessionLike): session is { user: { id: string; isAnonymous?: false } } {
  return hasSessionIdentity(session) && !isAnonymousSession(session);
}

export function getSessionUserRole(session: SessionLike): SessionRole | null {
  const role = (session?.user as { role?: unknown } | null | undefined)?.role;

  return role === "ADMIN" || role === "USER" ? role : null;
}
