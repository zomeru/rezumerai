import { describe, expect, it } from "bun:test";

describe("RootLayout", () => {
  it("waits for an incoming request so nonce-based CSP can be applied", async () => {
    const source = await Bun.file(new URL("../layout.tsx", import.meta.url)).text();

    expect(source).toMatch(/import\s+\{\s*connection\s*\}\s+from\s+"next\/server"/);
    expect(source).toMatch(/await\s+connection\(\);/);
  });
});
