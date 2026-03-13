import { describe, expect, it } from "bun:test";
import { createCorsConfig, getAllowedCorsOrigins } from "../cors";

const baseEnv = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("getAllowedCorsOrigins", () => {
  it("includes validated site URLs and configured extra origins without duplicates", () => {
    expect(
      getAllowedCorsOrigins({
        ...baseEnv,
        CORS_ALLOWED_ORIGINS: "https://app.rezumerai.com, https://admin.rezumerai.com, http://localhost:3000",
      }),
    ).toEqual(["http://localhost:3000", "https://app.rezumerai.com", "https://admin.rezumerai.com"]);
  });
});

describe("createCorsConfig", () => {
  it("builds an explicit allowlist with credentials enabled", () => {
    expect(
      createCorsConfig({
        ...baseEnv,
        CORS_ALLOWED_ORIGINS: "https://admin.rezumerai.com",
      }),
    ).toEqual({
      origin: ["http://localhost:3000", "https://admin.rezumerai.com"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });
  });

  it("never falls back to wildcard origins", () => {
    const config = createCorsConfig({
      ...baseEnv,
      CORS_ALLOWED_ORIGINS: "https://admin.rezumerai.com",
    });

    expect(config.origin).not.toBe(true);
    expect(config.origin).not.toBe("*");
  });
});
