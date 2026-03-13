import { describe, expect, it } from "bun:test";
import { toDisplaySafeUiMessageParts } from "../ai-message-parts";

describe("toDisplaySafeUiMessageParts", () => {
  it("keeps only visible assistant text and drops internal stream and tool parts", () => {
    const parts = [
      { type: "step-start" },
      { type: "text", text: "The available models are GPT-5 Mini and Claude." },
      { type: "reasoning", text: "Checking available models" },
      {
        type: "dynamic-tool",
        toolName: "listAvailableModels",
        toolCallId: "call_dynamic_1",
        state: "output-available",
        input: {},
        output: {
          models: ["gpt-5-mini", "claude-3.7-sonnet"],
        },
      },
      {
        type: "tool-listAvailableModels",
        toolCallId: "call_static_1",
        state: "output-available",
        input: {},
        output: {
          models: ["gpt-5-mini", "claude-3.7-sonnet"],
        },
      },
      { type: "source-url", sourceId: "source_docs", url: "https://example.com", title: "Docs" },
    ] as Parameters<typeof toDisplaySafeUiMessageParts>[0];

    expect(toDisplaySafeUiMessageParts(parts)).toEqual([
      { type: "text", text: "The available models are GPT-5 Mini and Claude." },
    ]);
  });
});
