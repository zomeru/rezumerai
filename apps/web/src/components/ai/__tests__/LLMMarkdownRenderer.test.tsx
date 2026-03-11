import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import LLMMarkdownRenderer from "../LLMMarkdownRenderer";

const writeTextMock = mock(async (_value: string) => undefined);

describe("LLMMarkdownRenderer", () => {
  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
  });

  it("renders rich markdown content and lets users copy fenced code blocks", async () => {
    const markdown = `# Shipping notes

Use \`fetch()\` instead of \`XMLHttpRequest\`.

- Preserve formatting
- Render tables

| Column | Value |
| --- | --- |
| Status | Ready |

> Stream safely

\`\`\`ts
const result = await fetch("/api/demo");
\`\`\`
`;

    const view = render(<LLMMarkdownRenderer content={markdown} />);

    expect(view.getByRole("heading", { name: "Shipping notes" })).toBeTruthy();
    expect(view.getByText("fetch()").tagName).toBe("CODE");
    expect(view.getByRole("table")).toBeTruthy();
    expect(view.getByText("Stream safely").closest("blockquote")).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: /copy code/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('const result = await fetch("/api/demo");');
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1900));
    });

    view.unmount();
  });

  it("keeps rendering while streamed markdown is still incomplete", () => {
    const { container, getByText, rerender, getByRole } = render(
      <LLMMarkdownRenderer content={"1. First item\n\n```ts\nconst partial ="} />,
    );

    expect(getByText("First item")).toBeTruthy();
    expect(container.querySelector("code")?.textContent).toContain("const partial =");

    rerender(<LLMMarkdownRenderer content={"1. First item\n\n```ts\nconst partial = true;\n```"} />);

    expect(getByRole("button", { name: /copy code/i })).toBeTruthy();
  });
});
