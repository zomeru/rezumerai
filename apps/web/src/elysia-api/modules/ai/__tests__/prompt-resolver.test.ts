import { describe, expect, it } from "bun:test";
import { DEFAULT_AI_CONFIGURATION } from "@rezumerai/types";
import { resolveAiSystemPrompt } from "../prompts/resolver";

describe("resolveAiSystemPrompt", () => {
  it("keeps assistant prompt composition separate from workflow-specific prompts", () => {
    const prompt = resolveAiSystemPrompt({
      config: {
        ...DEFAULT_AI_CONFIGURATION,
        ASSISTANT_SYSTEM_PROMPT: "Assistant base prompt.",
      },
      workflow: {
        feature: "assistant",
        action: "chat",
      },
      currentPath: "/workspace",
      memoryContext: "Recent memory block",
      ragContext: "Knowledge block",
      scope: "USER",
      toolNames: ["getPublicFaq", "listMyRecentResumes"],
    });

    expect(prompt).toContain("Assistant base prompt.");
    expect(prompt).toContain("Feature=assistant");
    expect(prompt).toContain("Action=chat");
    expect(prompt).toContain("CurrentPage=/workspace");
    expect(prompt).toContain("Use prior messages from the same thread");
  });

  it("resolves the review workflow to the dedicated review prompt", () => {
    const prompt = resolveAiSystemPrompt({
      config: {
        ...DEFAULT_AI_CONFIGURATION,
        RESUME_COPILOT_OPTIMIZE_SYSTEM_PROMPT: "Optimize base prompt.",
        RESUME_COPILOT_REVIEW_SYSTEM_PROMPT: "Review base prompt.",
      },
      workflow: {
        feature: "resume-copilot",
        action: "review",
      },
      scope: "USER",
      toolNames: ["getResume", "matchResumeToJob"],
    });

    expect(prompt).toContain("Review base prompt.");
    expect(prompt).not.toContain("Optimize base prompt.");
    expect(prompt).toContain("Feature=resume-copilot");
    expect(prompt).toContain("Action=review");
    expect(prompt).toContain("Return only the requested structured result");
  });

  it("returns the text optimizer prompt without resume-copilot composition rules", () => {
    const prompt = resolveAiSystemPrompt({
      config: {
        ...DEFAULT_AI_CONFIGURATION,
        TEXT_OPTIMIZER_SYSTEM_PROMPT: "Text optimizer base prompt.",
      },
      workflow: {
        feature: "text-optimizer",
        action: "optimize",
      },
    });

    expect(prompt).toBe("Text optimizer base prompt.");
  });
});
