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

    expect(scriptSrc).toContain("script-src 'self'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).toContain("'nonce-");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(styleSrc).toContain("'unsafe-inline'");
  });

  it("attaches nonce to request and response headers", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");

    const request = new NextRequest("https://example.com/");
    const response = await proxy(request);

    const nonceHeader = response.headers.get("x-nonce");

    expect(nonceHeader).toBeString();
    expect(nonceHeader).not.toBeNull();
    expect(nonceHeader).not.toBe("");
    expect(response.headers.get("Content-Security-Policy")).toContain(`'nonce-${nonceHeader}'`);
  });

  it("forwards the CSP header to request-time rendering", async () => {
    Reflect.set(process.env, "NODE_ENV", "production");

    const response = await proxy(new NextRequest("https://example.com/"));
    const overriddenHeaders = response.headers.get("x-middleware-override-headers");
    const forwardedCsp = response.headers.get("x-middleware-request-content-security-policy");

    expect(overriddenHeaders).toBeString();
    expect(overriddenHeaders?.toLowerCase()).toContain("content-security-policy");
    expect(forwardedCsp).toBeString();
    expect(forwardedCsp).toContain("script-src");
    expect(forwardedCsp).toContain("'strict-dynamic'");
    expect(forwardedCsp).toContain("'nonce-");
  });
});
