export type SessionLike = {
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

export function hasRegisteredSession(session: SessionLike): session is { user: { id: string; isAnonymous?: false } } {
  return hasSessionIdentity(session) && !isAnonymousSession(session);
}
