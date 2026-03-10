import { beforeAll, describe, expect, it } from "bun:test";

let authClientModule: typeof import("../auth-client");

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
  process.env.NODE_ENV ??= "test";
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  process.env.BETTER_AUTH_GITHUB_CLIENT_ID ??= "github-client-id";
  process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET ??= "github-client-secret";
  process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/rezumerai_test";
  process.env.OPENROUTER_API_KEY ??= "test-openrouter-key";

  authClientModule = await import("../auth-client");
});

describe("authClient anonymous support", () => {
  it("exposes anonymous sign-in for guest session bootstrap", () => {
    expect(typeof (authClientModule.signIn as { anonymous?: unknown }).anonymous).toBe("function");
  });

  it("detects anonymous sessions and resolved identities", () => {
    expect(authClientModule.isAnonymousSession({ user: { id: "anon_123", isAnonymous: true } })).toBe(true);
    expect(authClientModule.isAnonymousSession({ user: { id: "user_123", isAnonymous: false } })).toBe(false);
    expect(authClientModule.hasSessionIdentity({ user: { id: "user_123", isAnonymous: false } })).toBe(true);
    expect(authClientModule.hasSessionIdentity(null)).toBe(false);
  });

  it("sends an empty JSON payload when bootstrapping an anonymous session", async () => {
    const calls: unknown[] = [];

    await authClientModule.startAnonymousSession(async (payload) => {
      calls.push(payload);
      return { data: null };
    });

    expect(calls).toEqual([{}]);
  });
});
