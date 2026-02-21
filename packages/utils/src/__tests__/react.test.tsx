import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { onKeyDown } from "../react";

describe("onKeyDown", () => {
  it("stops propagation for Enter key", () => {
    const stopPropagation = mock();
    const event = {
      key: "Enter",
      stopPropagation,
    } as unknown as React.KeyboardEvent;

    onKeyDown(event);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("stops propagation for Space key", () => {
    const stopPropagation = mock();
    const event = {
      key: " ",
      stopPropagation,
    } as unknown as React.KeyboardEvent;

    onKeyDown(event);

    expect(stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("does not stop propagation for other keys", () => {
    const stopPropagation = mock();
    const event = {
      key: "a",
      stopPropagation,
    } as unknown as React.KeyboardEvent;

    onKeyDown(event);

    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("does not stop propagation for Tab key", () => {
    const stopPropagation = mock();
    const event = {
      key: "Tab",
      stopPropagation,
    } as unknown as React.KeyboardEvent;

    onKeyDown(event);

    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("does not stop propagation for Escape key", () => {
    const stopPropagation = mock();
    const event = {
      key: "Escape",
      stopPropagation,
    } as unknown as React.KeyboardEvent;

    onKeyDown(event);

    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it("does not stop propagation for Arrow keys", () => {
    const stopPropagation = mock();
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

    for (const key of keys) {
      stopPropagation.mockClear();
      const event = {
        key,
        stopPropagation,
      } as unknown as React.KeyboardEvent;

      onKeyDown(event);

      expect(stopPropagation).not.toHaveBeenCalled();
    }
  });

  it("works in a real component", () => {
    function TestComponent() {
      const handleKeyDown = (e: React.KeyboardEvent) => {
        onKeyDown(e);
      };

      return (
        // biome-ignore lint/a11y/noStaticElementInteractions: This is just a test component to verify onKeyDown works as expected
        <div onKeyDown={handleKeyDown}>
          <input type="text" placeholder="Test input" />
        </div>
      );
    }

    const { container } = render(<TestComponent />);
    const input = screen.getByPlaceholderText("Test input");

    expect(container).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });
});
