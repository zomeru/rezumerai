import { beforeEach, describe, expect, it, mock } from "bun:test";

const findUniqueMock = mock();

mock.module("@rezumerai/database", () => ({
  Prisma: {},
  prisma: {
    featureFlag: {
      findUnique: findUniqueMock,
    },
  },
}));

const { clearFeatureFlagCache, isFeatureEnabled } = await import("../feature-flags");

describe("isFeatureEnabled", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    clearFeatureFlagCache();
  });

  it("returns false when the feature flag does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(isFeatureEnabled("missing_feature")).resolves.toBe(false);
  });

  it("returns false when the feature_flag table is not available yet", async () => {
    findUniqueMock.mockRejectedValue({
      code: "P2021",
    });

    await expect(isFeatureEnabled("new_admin_analytics_ui")).resolves.toBe(false);
  });

  it("returns true for globally enabled flags and reuses cached lookups", async () => {
    findUniqueMock.mockResolvedValue({
      enabled: true,
      rolloutPercentage: 100,
    });

    await expect(isFeatureEnabled("new_admin_analytics_ui")).resolves.toBe(true);
    await expect(isFeatureEnabled("new_admin_analytics_ui")).resolves.toBe(true);

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("keeps partial rollouts off until a rollout subject is provided", async () => {
    findUniqueMock.mockResolvedValue({
      enabled: true,
      rolloutPercentage: 50,
    });

    await expect(isFeatureEnabled("new_admin_analytics_ui")).resolves.toBe(false);
  });

  it("supports deterministic percentage rollouts when a subject key is provided", async () => {
    findUniqueMock.mockResolvedValue({
      enabled: true,
      rolloutPercentage: 50,
    });

    const evaluations = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        isFeatureEnabled("new_admin_analytics_ui", {
          subjectKey: `admin_${index}`,
        }),
      ),
    );

    expect(evaluations.some(Boolean)).toBe(true);
    expect(evaluations.some((value) => !value)).toBe(true);
  });
});
