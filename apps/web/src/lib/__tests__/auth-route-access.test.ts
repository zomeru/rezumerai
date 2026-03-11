import { describe, expect, it } from "bun:test";
import { canAccessAuthPage, canAccessSessionRoute } from "../auth-route-access";

describe("auth route access helpers", () => {
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
