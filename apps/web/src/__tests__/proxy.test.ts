import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

mock.module("@/lib/request-auth", () => ({
  resolveRequestSessionIdentity: mock(async () => ({
    role: null,
    session: null,
    userId: null,
  })),
}));

const originalNodeEnv = process.env.NODE_ENV;
let proxy: typeof import("../proxy").proxy;

function getDirective(csp: string, directiveName: string): string | undefined {
  return csp
    .split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith(`${directiveName} `));
}

afterEach(() => {
  Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
});

beforeAll(async () => {
  ({ proxy } = await import("../proxy"));
});

describe("proxy CSP", () => {
  it("does not allow inline scripts in production", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");

    const response = await proxy(new NextRequest("https://example.com/"));
    const csp = response.headers.get("Content-Security-Policy");

    expect(csp).toBeString();
    expect(csp).not.toBeNull();

    const scriptSrc = getDirective(csp ?? "", "script-src");
    const styleSrc = getDirective(csp ?? "", "style-src");

    expect(scriptSrc).toBe("script-src 'self' blob:");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(styleSrc).toContain("'unsafe-inline'");
  });
});
