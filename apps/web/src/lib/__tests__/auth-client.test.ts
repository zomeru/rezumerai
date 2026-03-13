import { beforeAll, describe, expect, it } from "bun:test";
import { hasSessionIdentity, isAnonymousSession } from "../auth-session";

let authClientModule: typeof import("../auth-client");
const writableEnv = process.env as Record<string, string | undefined>;

beforeAll(async () => {
  writableEnv.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
  writableEnv.NODE_ENV ??= "test";
  writableEnv.BETTER_AUTH_URL ??= "http://localhost:3000";
  writableEnv.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  writableEnv.BETTER_AUTH_GITHUB_CLIENT_ID ??= "github-client-id";
  writableEnv.BETTER_AUTH_GITHUB_CLIENT_SECRET ??= "github-client-secret";
  writableEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/rezumerai_test";
  writableEnv.OPENROUTER_API_KEY ??= "test-openrouter-key";

  authClientModule = await import(new URL("../auth-client.ts?test=auth-client", import.meta.url).href);
});

describe("authClient anonymous support", () => {
  it("exposes anonymous sign-in for guest session bootstrap", () => {
    expect(typeof (authClientModule.signIn as { anonymous?: unknown }).anonymous).toBe("function");
  });

  it("detects anonymous sessions and resolved identities", () => {
    expect(isAnonymousSession({ user: { id: "anon_123", isAnonymous: true } })).toBe(true);
    expect(isAnonymousSession({ user: { id: "user_123", isAnonymous: false } })).toBe(false);
    expect(hasSessionIdentity({ user: { id: "user_123", isAnonymous: false } })).toBe(true);
    expect(hasSessionIdentity(null)).toBe(false);
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
