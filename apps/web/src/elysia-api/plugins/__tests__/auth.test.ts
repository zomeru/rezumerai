import { describe, expect, it } from "bun:test";
import { isAuthOptionalPath } from "../auth-paths";

describe("isAuthOptionalPath", () => {
  it("allows public assistant chat routes for guests", () => {
    expect(isAuthOptionalPath("/api/ai/assistant/chat")).toBe(true);
    expect(isAuthOptionalPath("/api/ai/assistant/history")).toBe(true);
  });

  it("keeps protected routes behind authentication", () => {
    expect(isAuthOptionalPath("/api/ai/settings")).toBe(false);
    expect(isAuthOptionalPath("/api/admin/users")).toBe(false);
  });
});
