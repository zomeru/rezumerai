import { describe, expect, it } from "bun:test";
import { createApiHelmetConfig } from "../helmet";

function joinSources(sources: string[] | undefined): string {
  return (sources ?? []).join(" ");
}

describe("createApiHelmetConfig", () => {
  it("allows Scalar docs assets in development", () => {
    const config = createApiHelmetConfig({ isDev: true });
    const csp = config.csp;

    expect(csp).toBeDefined();
    expect(joinSources(csp?.scriptSrc)).toContain("'unsafe-inline'");
    expect(joinSources(csp?.scriptSrc)).toContain("'unsafe-eval'");
    expect(joinSources(csp?.scriptSrc)).toContain("https://cdn.jsdelivr.net");
    expect(joinSources(csp?.styleSrc)).toContain("https://fonts.googleapis.com");
    expect(joinSources(csp?.fontSrc)).toContain("https://fonts.gstatic.com");
    expect(joinSources(csp?.connectSrc)).toContain("https://proxy.scalar.com");
    expect(joinSources(csp?.connectSrc)).toContain("https://api.scalar.com");
  });

  it("keeps production API CSP strict without Scalar dev relaxations", () => {
    const config = createApiHelmetConfig({ isDev: false });
    const csp = config.csp;

    expect(csp).toBeDefined();
    expect(joinSources(csp?.scriptSrc)).not.toContain("https://cdn.jsdelivr.net");
    expect(joinSources(csp?.scriptSrc)).not.toContain("'unsafe-eval'");
    expect(joinSources(csp?.styleSrc)).not.toContain("https://fonts.googleapis.com");
    expect(joinSources(csp?.connectSrc)).not.toContain("https://proxy.scalar.com");
  });
});
