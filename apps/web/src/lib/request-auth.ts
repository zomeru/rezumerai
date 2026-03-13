import { prisma, type User, type UserRole } from "@rezumerai/database";
import { auth } from "@/lib/auth";
import { hasSessionIdentity, isAnonymousSession } from "./auth-session";

type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface RequestSessionIdentity {
  isAnonymous: boolean;
  role: UserRole | null;
  session: BetterAuthSession;
  userId: string | null;
}

function toHeaders(requestHeaders: HeadersInit): Headers {
  return requestHeaders instanceof Headers ? requestHeaders : new Headers(requestHeaders);
}

export async function getSessionFromRequestHeaders(requestHeaders: HeadersInit): Promise<BetterAuthSession> {
  return auth.api.getSession({
    headers: toHeaders(requestHeaders),
  });
}

export async function resolveRequestSessionIdentity(requestHeaders: HeadersInit): Promise<RequestSessionIdentity> {
  const session = await getSessionFromRequestHeaders(requestHeaders);
  const isAnonymous = isAnonymousSession(session);

  if (!hasSessionIdentity(session)) {
    return {
      session,
      userId: null,
      role: null,
      isAnonymous,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  return {
    session,
    userId: session.user.id,
    role: user?.role ?? null,
    isAnonymous,
  };
}

export async function resolveRequestSessionUser(requestHeaders: HeadersInit): Promise<User | null> {
  const session = await getSessionFromRequestHeaders(requestHeaders);

  if (!hasSessionIdentity(session)) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });
}
