import { describe, expect, it } from "bun:test";
import { getAuditSnapshotSelect, shapeAuditSnapshot } from "../audit-snapshots";

describe("audit snapshots", () => {
  it("uses a narrowed select for text-heavy resume audits", () => {
    expect(getAuditSnapshotSelect("Resume")).toEqual(
      expect.objectContaining({
        id: true,
        professionalSummary: true,
        skills: true,
      }),
    );
  });

  it("summarizes resume snapshots instead of storing full text fields", () => {
    const snapshot = shapeAuditSnapshot("Resume", {
      id: "resume_123",
      userId: "user_123",
      title: "Senior Engineer",
      public: true,
      template: "classic",
      accentColor: "#111111",
      fontSize: "medium",
      customFontSize: 1,
      skills: ["TypeScript", "React", "Prisma"],
      professionalSummary: "A".repeat(220),
      createdAt: new Date("2026-03-12T00:00:00.000Z"),
      updatedAt: new Date("2026-03-12T01:00:00.000Z"),
    }) as Record<string, unknown>;

    expect(snapshot).toEqual(
      expect.objectContaining({
        id: "resume_123",
        skillsCount: 3,
        professionalSummaryLength: 220,
      }),
    );
    expect(snapshot.professionalSummaryPreview).toBeString();
    expect("professionalSummary" in snapshot).toBe(false);
  });

  it("summarizes assistant messages without storing full blocks payloads", () => {
    const snapshot = shapeAuditSnapshot("AiAssistantConversationMessage", {
      id: "msg_123",
      conversationId: "conv_123",
      role: "assistant",
      content: "Helpful response ".repeat(20),
      blocks: [{ type: "text", text: "large-block-payload" }],
      toolNames: ["search", "optimize"],
      createdAt: new Date("2026-03-12T02:00:00.000Z"),
    }) as Record<string, unknown>;

    expect(snapshot).toEqual(
      expect.objectContaining({
        id: "msg_123",
        toolCount: 2,
        blocksSummary: {
          type: "array",
          itemCount: 1,
        },
      }),
    );
    expect(snapshot.contentLength).toBeGreaterThan(0);
    expect("content" in snapshot).toBe(false);
  });

  it("falls back to the original payload for models without a custom shaper", () => {
    const payload = {
      id: "custom_123",
      value: "keep-me",
    };

    expect(shapeAuditSnapshot("CustomModel", payload)).toEqual(payload);
  });
});
