import { hasRegisteredSession, hasSessionIdentity, type SessionLike } from "./auth-session";

export function canAccessAuthPage(session: SessionLike): boolean {
  return !hasRegisteredSession(session);
}

export function canAccessSessionRoute(session: SessionLike): boolean {
  return hasSessionIdentity(session);
}
