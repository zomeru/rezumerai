import { describe, expect, it } from "bun:test";
import { SessionUserSchema, UserSchema } from "../user/schema";

const baseUser = {
  id: "user_123",
  name: "Anonymous User",
  email: "anon@example.com",
  emailVerified: false,
  image: null,
  role: "USER" as const,
  createdAt: new Date("2026-03-10T00:00:00.000Z"),
  updatedAt: new Date("2026-03-10T00:00:00.000Z"),
};

describe("SessionUserSchema", () => {
  it("preserves the anonymous-user flag from Better Auth sessions", () => {
    const parsed = SessionUserSchema.parse({
      ...baseUser,
      isAnonymous: true,
    });

    expect(parsed.isAnonymous).toBe(true);
  });
});

describe("UserSchema", () => {
  it("preserves the anonymous-user flag on persisted users", () => {
    const parsed = UserSchema.parse({
      ...baseUser,
      isAnonymous: true,
      lastPasswordChangeAt: null,
      banned: false,
      banReason: null,
      banExpires: null,
      selectedAiModel: "openrouter/free",
    });

    expect(parsed.isAnonymous).toBe(true);
  });
});
