import { describe, expect, it } from "bun:test";
import { SYSTEM_CONFIGURATION_KEYS } from "@rezumerai/types";
import { ROUTES } from "@/constants/routing";
import { ADMIN_CONTENT_TOPICS, getAdminContentTopicMetadata } from "../topic-metadata";

describe("topic-metadata", () => {
  it("exports the six supported admin content topics with stable mappings", () => {
    expect(ADMIN_CONTENT_TOPICS).toHaveLength(6);

    expect(getAdminContentTopicMetadata("landing")).toEqual(
      expect.objectContaining({
        configKey: SYSTEM_CONFIGURATION_KEYS.LANDING_PAGE_INFORMATION,
        publicHref: ROUTES.HOME,
        schemaFamily: "LANDING_PAGE",
      }),
    );

    expect(getAdminContentTopicMetadata("faq")).toEqual(
      expect.objectContaining({
        configKey: SYSTEM_CONFIGURATION_KEYS.FAQ_INFORMATION,
        publicHref: ROUTES.FAQ,
        schemaFamily: "FAQ",
      }),
    );

    expect(getAdminContentTopicMetadata("about")).toEqual(
      expect.objectContaining({
        configKey: SYSTEM_CONFIGURATION_KEYS.ABOUT_US_INFORMATION,
        publicHref: ROUTES.ABOUT,
        schemaFamily: "CONTENT_PAGE",
      }),
    );

    expect(getAdminContentTopicMetadata("contact")).toEqual(
      expect.objectContaining({
        configKey: SYSTEM_CONFIGURATION_KEYS.CONTACT_INFORMATION,
        publicHref: ROUTES.CONTACT,
        schemaFamily: "CONTENT_PAGE",
      }),
    );

    expect(getAdminContentTopicMetadata("privacy")).toEqual(
      expect.objectContaining({
        configKey: SYSTEM_CONFIGURATION_KEYS.PRIVACY_POLICY_INFORMATION,
        publicHref: ROUTES.PRIVACY,
        schemaFamily: "CONTENT_PAGE",
      }),
    );

    expect(getAdminContentTopicMetadata("terms")).toEqual(
      expect.objectContaining({
        configKey: SYSTEM_CONFIGURATION_KEYS.TOS_INFORMATION,
        publicHref: ROUTES.TERMS,
        schemaFamily: "CONTENT_PAGE",
      }),
    );
  });
});
