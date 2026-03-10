import { describe, expect, it } from "bun:test";
import { ERROR_MESSAGES } from "@/constants/errors";
import { getAiFeatureAccessMessage } from "../ai-access";

describe("getAiFeatureAccessMessage", () => {
  it("requires a real sign-in for anonymous users", () => {
    expect(
      getAiFeatureAccessMessage({
        isAnonymous: true,
        emailVerified: false,
      }),
    ).toBe(ERROR_MESSAGES.AI_AUTH_REQUIRED);
  });

  it("requires email verification for registered users", () => {
    expect(
      getAiFeatureAccessMessage({
        isAnonymous: false,
        emailVerified: false,
      }),
    ).toBe(ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED);
  });

  it("allows verified registered users", () => {
    expect(
      getAiFeatureAccessMessage({
        isAnonymous: false,
        emailVerified: true,
      }),
    ).toBeNull();
  });
});
