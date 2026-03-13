import { describe, expect, it } from "bun:test";
import { FeatureFlagEntrySchema } from "../admin/schema";

describe("FeatureFlagEntrySchema", () => {
  it("accepts cuid-style string feature flag ids", () => {
    const parsed = FeatureFlagEntrySchema.parse({
      id: "cfeatflagadminanalytics01",
      name: "new_admin_analytics_ui",
      enabled: false,
      description: "Controls the interactive analytics dashboard rollout.",
      rolloutPercentage: 100,
      createdAt: "2026-03-13T03:00:00.000Z",
      updatedAt: "2026-03-13T03:00:00.000Z",
    });

    expect(parsed.id).toBe("cfeatflagadminanalytics01");
  });
});
