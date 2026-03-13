import { beforeEach, describe, expect, it, mock } from "bun:test";

const hasRegisteredSessionMock = mock(
  (session: { user?: { isAnonymous?: boolean | null; id?: string | null } } | null) => {
    return typeof session?.user?.id === "string" && session.user.id.length > 0 && session.user.isAnonymous !== true;
  },
);

const hasSessionIdentityMock = mock((session: { user?: { id?: string | null } } | null) => {
  return typeof session?.user?.id === "string" && session.user.id.length > 0;
});

mock.module("../auth-session", () => ({
  hasRegisteredSession: hasRegisteredSessionMock,
  hasSessionIdentity: hasSessionIdentityMock,
}));

mock.module("../auth-session.ts", () => ({
  hasRegisteredSession: hasRegisteredSessionMock,
  hasSessionIdentity: hasSessionIdentityMock,
}));

mock.module("./auth-session", () => ({
  hasRegisteredSession: hasRegisteredSessionMock,
  hasSessionIdentity: hasSessionIdentityMock,
}));

const { canAccessAuthPage, canAccessSessionRoute } = await import("../auth-route-access");

describe("auth route access helpers", () => {
  beforeEach(() => {
    hasRegisteredSessionMock.mockClear();
    hasSessionIdentityMock.mockClear();
  });

  it("allows guests and anonymous sessions to access sign-in and sign-up pages", () => {
    expect(canAccessAuthPage(null)).toBe(true);
    expect(
      canAccessAuthPage({
        user: {
          id: "anon_123",
          isAnonymous: true,
        },
      }),
    ).toBe(true);
  });

  it("redirects registered users away from sign-in and sign-up pages", () => {
    expect(
      canAccessAuthPage({
        user: {
          id: "user_123",
          isAnonymous: false,
        },
      }),
    ).toBe(false);
  });

  it("keeps current session-gated routes available to both anonymous and registered users", () => {
    expect(canAccessSessionRoute(null)).toBe(false);
    expect(
      canAccessSessionRoute({
        user: {
          id: "anon_123",
          isAnonymous: true,
        },
      }),
    ).toBe(true);
    expect(
      canAccessSessionRoute({
        user: {
          id: "user_123",
          isAnonymous: false,
        },
      }),
    ).toBe(true);
  });
});
