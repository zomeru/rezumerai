import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import JsonViewer from "../JsonViewer";

const writeTextMock = mock(async (_value: string) => undefined);

describe("JsonViewer", () => {
  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });
  });

  it("renders structured JSON and copies the pretty-printed payload", async () => {
    const value = {
      alpha: 1,
      nested: {
        beta: true,
      },
    };

    const view = render(<JsonViewer value={value} />);

    expect(view.getByText(/^alpha:/)).toBeTruthy();
    expect(view.getByText(/^nested:/)).toBeTruthy();
    expect(view.getByText(/^beta:/)).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: /copy json/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(value, null, 2));
    });

    view.unmount();
    await act(async () => {});
  });

  it("lets users collapse and expand nested content", () => {
    const value = {
      service: {
        metadata: {
          region: "us-east-1",
        },
      },
    };

    const view = render(<JsonViewer value={value} />);

    expect(view.getByText(/^region:/)).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: /collapse all/i }));
    expect(view.queryByText(/^region:/)).toBeNull();

    fireEvent.click(view.getByRole("button", { name: /expand all/i }));
    expect(view.getByText(/^region:/)).toBeTruthy();

    view.unmount();
  });

  it("shows a safe fallback for invalid JSON strings", () => {
    const view = render(<JsonViewer value={'{"alpha":'} parseStringAsJson />);

    expect(view.getByText("Invalid JSON")).toBeTruthy();
    expect(view.getByText('{"alpha":')).toBeTruthy();

    view.unmount();
  });
});
