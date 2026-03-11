import { describe, expect, it } from "bun:test";
import { toDisplaySafeUiMessageParts } from "../ai-message-parts";

describe("toDisplaySafeUiMessageParts", () => {
  it("keeps only visible assistant text and drops internal stream and tool parts", () => {
    expect(
      toDisplaySafeUiMessageParts([
        { type: "step-start" },
        { type: "text", text: "The available models are GPT-5 Mini and Claude." },
        { type: "reasoning", text: "Checking available models" },
        {
          type: "dynamic-tool",
          toolName: "listAvailableModels",
          state: "output-available",
          output: {
            models: ["gpt-5-mini", "claude-3.7-sonnet"],
          },
        },
        {
          type: "tool-listAvailableModels",
          state: "output-available",
          output: {
            models: ["gpt-5-mini", "claude-3.7-sonnet"],
          },
        },
        { type: "source-url", url: "https://example.com", title: "Docs" },
      ]),
    ).toEqual([{ type: "text", text: "The available models are GPT-5 Mini and Claude." }]);
  });
});
