import { describe, expect, it } from "bun:test";
import { composeAiSystemPrompt } from "../prompts/composer";

describe("composeAiSystemPrompt", () => {
  it("builds assistant prompts with scope, tools, rag, and memory blocks", () => {
    const prompt = composeAiSystemPrompt({
      baseSystemPrompt: "Base assistant prompt.",
      currentPath: "/workspace",
      flow: "assistant",
      memoryContext: "Recent memory block",
      ragContext: "Knowledge block",
      scope: "USER",
      toolNames: ["getPublicFaq", "listMyRecentResumes"],
    });

    expect(prompt).toContain("Base assistant prompt.");
    expect(prompt).toContain("Scope=USER");
    expect(prompt).toContain("CurrentPage=/workspace");
    expect(prompt).toContain("getPublicFaq");
    expect(prompt).toContain("listMyRecentResumes");
    expect(prompt).toContain("Knowledge block");
    expect(prompt).toContain("Recent memory block");
    expect(prompt).toContain("Use prior messages from the same thread");
    expect(prompt).toContain("Never expose raw JSON or tool payloads");
  });

  it("builds copilot prompts with flow-specific output rules", () => {
    const prompt = composeAiSystemPrompt({
      baseSystemPrompt: "Base copilot prompt.",
      flow: "copilot-review",
      scope: "USER",
      toolNames: ["getResume", "matchResumeToJob"],
    });

    expect(prompt).toContain("Base copilot prompt.");
    expect(prompt).toContain("Flow=copilot-review");
    expect(prompt).toContain("matchResumeToJob");
    expect(prompt).toContain("Return only the requested structured result");
  });
});
