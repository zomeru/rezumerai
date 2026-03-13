import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import {
  adminRefetchMock,
  resetAdminHooksModuleMock,
  updateSystemConfigurationMutateAsyncMock,
  useSystemConfigurationsMock,
} from "@/test-utils/admin-hooks-module-mock";

mock.module("sonner", () => ({
  toast: {
    success: mock(() => undefined),
    error: mock(() => undefined),
  },
}));

const contentPageValue = {
  title: "About Rezumerai",
  summary: "Public about copy",
  lastUpdated: "March 13, 2026",
  sections: [
    {
      id: "mission",
      heading: "Mission",
      paragraphs: ["Paragraph one"],
      bullets: [],
    },
    {
      id: "principles",
      heading: "Principles",
      paragraphs: ["Paragraph two"],
      bullets: [],
    },
  ],
  cards: [],
  cta: null,
};

const faqValue = {
  title: "Frequently Asked Questions",
  summary: "Answers about the product",
  categories: [
    {
      id: "general",
      title: "General",
      items: [
        {
          id: "what-is-rezumerai",
          question: "What is Rezumerai?",
          answer: "An AI-assisted resume builder.",
          tags: ["product"],
        },
      ],
    },
  ],
};

const landingValue = {
  bannerTag: "Early access",
  hero: {
    title: "Build a resume you are proud to send.",
    description: "Structured editing and reviewable AI help.",
    primaryCtaLabel: "Get started",
    secondaryCtaLabel: "View sample",
    trustBadges: ["Structured editing"],
  },
  featureSection: {
    eyebrow: "Features",
    title: "What it does",
    description: "A focused resume workflow",
    items: [
      {
        title: "Resume Copilot",
        description: "Refine one section at a time.",
        icon: "sparkles",
      },
      {
        title: "Targeted tailoring",
        description: "Align content to a role.",
        icon: "target",
      },
      {
        title: "Clean exports",
        description: "Export polished PDFs.",
        icon: "file-text",
      },
    ],
  },
  workflowSection: {
    eyebrow: "Workflow",
    title: "How it works",
    description: "Edit, review, and export.",
    items: [
      {
        title: "Start from your resume",
        description: "Paste or build from scratch.",
      },
      {
        title: "Improve one section",
        description: "Only change what needs work.",
      },
      {
        title: "Review before saving",
        description: "Keep every change explicit.",
      },
    ],
  },
  ctaSection: {
    title: "Create your next resume",
    description: "Build faster and stay in control.",
    primaryCtaLabel: "Create my resume",
    primaryCtaHref: "/signup",
  },
  footer: {
    description: "Rezumerai is an AI-assisted resume builder.",
  },
};

describe("ContentManagementPageClient", () => {
  beforeEach(() => {
    resetAdminHooksModuleMock();
    updateSystemConfigurationMutateAsyncMock.mockImplementation(async ({ name, value }) => ({
      id: `updated_${name}`,
      name,
      description: "Updated content entry",
      value,
      createdAt: "2026-03-13T08:00:00.000Z",
      updatedAt: "2026-03-13T10:00:00.000Z",
      isEditable: true,
      validationMode: "KNOWN_SCHEMA",
    }));
    useSystemConfigurationsMock.mockReturnValue({
      data: {
        items: [
          {
            id: "cfg_landing",
            name: "LANDING_PAGE_INFORMATION",
            description: "Landing page content",
            value: landingValue,
            createdAt: "2026-03-13T08:00:00.000Z",
            updatedAt: "2026-03-13T08:00:00.000Z",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
          },
          {
            id: "cfg_about",
            name: "ABOUT_US_INFORMATION",
            description: "About page content",
            value: contentPageValue,
            createdAt: "2026-03-13T08:00:00.000Z",
            updatedAt: "2026-03-13T08:00:00.000Z",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
          },
          {
            id: "cfg_contact",
            name: "CONTACT_INFORMATION",
            description: "Contact page content",
            value: { ...contentPageValue, title: "Contact" },
            createdAt: "2026-03-13T08:00:00.000Z",
            updatedAt: "2026-03-13T08:00:00.000Z",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
          },
          {
            id: "cfg_faq",
            name: "FAQ_INFORMATION",
            description: "FAQ content",
            value: faqValue,
            createdAt: "2026-03-13T08:00:00.000Z",
            updatedAt: "2026-03-13T08:00:00.000Z",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
          },
          {
            id: "cfg_privacy",
            name: "PRIVACY_POLICY_INFORMATION",
            description: "Privacy content",
            value: { ...contentPageValue, title: "Privacy Policy" },
            createdAt: "2026-03-13T08:00:00.000Z",
            updatedAt: "2026-03-13T08:00:00.000Z",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
          },
          {
            id: "cfg_terms",
            name: "TOS_INFORMATION",
            description: "Terms content",
            value: { ...contentPageValue, title: "Terms of Service" },
            createdAt: "2026-03-13T08:00:00.000Z",
            updatedAt: "2026-03-13T08:00:00.000Z",
            isEditable: true,
            validationMode: "KNOWN_SCHEMA",
          },
        ],
      },
      error: null,
      isLoading: false,
      isFetching: false,
      refetch: adminRefetchMock,
    });
  });

  it("renders all supported content topics and lets admins select them", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    expect(view.getByRole("button", { name: /Landing Page/i })).toBeTruthy();
    expect(view.getByRole("button", { name: /About/i })).toBeTruthy();
    expect(view.getByRole("button", { name: /Contact/i })).toBeTruthy();
    expect(view.getByRole("button", { name: /FAQ/i })).toBeTruthy();
    expect(view.getByRole("button", { name: /Privacy Policy/i })).toBeTruthy();
    expect(view.getByRole("button", { name: /Terms of Service/i })).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: /FAQ/i }));

    expect(view.getByRole("textbox", { name: "FAQ title" })).toHaveValue("Frequently Asked Questions");

    view.unmount();
    await act(async () => {});
  });

  it("preserves unsaved topic drafts when switching away and back", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    fireEvent.click(view.getByRole("button", { name: /About/i }));
    fireEvent.change(view.getByRole("textbox", { name: "Page title" }), {
      target: { value: "About Rezumerai Updated" },
    });

    expect(view.getAllByText("Unsaved").length).toBeGreaterThan(0);

    fireEvent.click(view.getByRole("button", { name: /FAQ/i }));
    fireEvent.click(view.getByRole("button", { name: /About/i }));

    expect(view.getByRole("textbox", { name: "Page title" })).toHaveValue("About Rezumerai Updated");

    view.unmount();
    await act(async () => {});
  });

  it("saves content-page edits through the about configuration key", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    fireEvent.click(view.getByRole("button", { name: /About/i }));
    fireEvent.change(view.getByRole("textbox", { name: "Page title" }), {
      target: { value: "About Rezumerai Saved" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateSystemConfigurationMutateAsyncMock).toHaveBeenCalledWith({
        name: "ABOUT_US_INFORMATION",
        value: expect.objectContaining({
          title: "About Rezumerai Saved",
        }),
      });
    });

    view.unmount();
    await act(async () => {});
  });

  it("saves FAQ edits through the FAQ configuration key", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    fireEvent.click(view.getByRole("button", { name: /FAQ/i }));
    fireEvent.change(view.getByRole("textbox", { name: "FAQ title" }), {
      target: { value: "FAQ Saved" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateSystemConfigurationMutateAsyncMock).toHaveBeenCalledWith({
        name: "FAQ_INFORMATION",
        value: expect.objectContaining({
          title: "FAQ Saved",
        }),
      });
    });

    view.unmount();
    await act(async () => {});
  });

  it("saves landing edits and preserves reordered feature items", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    fireEvent.change(view.getByRole("textbox", { name: "Banner tag" }), {
      target: { value: "Launch week" },
    });
    fireEvent.click(view.getByRole("button", { name: "Move feature item 1 down" }));
    fireEvent.click(view.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateSystemConfigurationMutateAsyncMock).toHaveBeenCalledWith({
        name: "LANDING_PAGE_INFORMATION",
        value: expect.objectContaining({
          bannerTag: "Launch week",
          featureSection: expect.objectContaining({
            items: [
              expect.objectContaining({ title: "Targeted tailoring" }),
              expect.objectContaining({ title: "Resume Copilot" }),
              expect.objectContaining({ title: "Clean exports" }),
            ],
          }),
        }),
      });
    });

    view.unmount();
    await act(async () => {});
  });

  it("blocks saving when raw JSON is syntactically invalid", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    fireEvent.click(view.getByRole("button", { name: "Raw JSON" }));
    fireEvent.change(view.getByRole("textbox", { name: "Raw JSON editor" }), {
      target: { value: "{" },
    });

    expect(view.getByText(/Invalid JSON:/)).toBeTruthy();
    expect(view.getByRole("button", { name: "Save changes" })).toBeDisabled();

    view.unmount();
    await act(async () => {});
  });

  it("formats, validates, and resets raw JSON edits", async () => {
    const { default: ContentManagementPageClient } = await import("../ContentManagementPageClient");
    const view = render(<ContentManagementPageClient />);

    fireEvent.click(view.getByRole("button", { name: /About/i }));
    fireEvent.click(view.getByRole("button", { name: "Raw JSON" }));

    const rawEditor = view.getByRole("textbox", { name: "Raw JSON editor" }) as HTMLTextAreaElement;
    const invalidSchemaJson = JSON.stringify({
      title: "Broken About",
      summary: "Missing sections",
      lastUpdated: "March 13, 2026",
      sections: [],
      cards: [],
      cta: null,
    });

    fireEvent.change(rawEditor, {
      target: { value: invalidSchemaJson },
    });

    expect(view.getByText(/sections: Too small:/i)).toBeTruthy();
    expect(view.getByRole("button", { name: "Save changes" })).toBeDisabled();

    const minifiedValidJson = JSON.stringify({
      ...contentPageValue,
      title: "About Rezumerai From JSON",
    });

    fireEvent.change(rawEditor, {
      target: { value: minifiedValidJson },
    });
    fireEvent.click(view.getByRole("button", { name: "Format JSON" }));

    expect(rawEditor.value).toContain('\n  "title": "About Rezumerai From JSON"');

    fireEvent.change(rawEditor, {
      target: { value: "{" },
    });
    fireEvent.click(view.getByRole("button", { name: "Reset changes" }));

    expect(rawEditor.value).toBe(JSON.stringify(contentPageValue, null, 2));

    view.unmount();
    await act(async () => {});
  });
});
