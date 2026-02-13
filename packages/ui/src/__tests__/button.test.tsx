import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button";

describe("Button Component", () => {
  it("renders correctly", () => {
    render(<Button appName="test-app">Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("handles click with appName", () => {
    render(<Button appName="my-app">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Delete");
  });

  it("can be disabled", () => {
    render(
      <Button appName="test-app" disabled>
        Disabled Button
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("shows alert with appName when clicked", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<Button appName="TestApp">Click me</Button>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(alertSpy).toHaveBeenCalledWith("Hello from your TestApp app!");
    alertSpy.mockRestore();
  });

  it("calls custom onClick handler after alert", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const mockOnClick = vi.fn();
    render(
      <Button appName="TestApp" onClick={mockOnClick}>
        Click me
      </Button>,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(alertSpy).toHaveBeenCalled();
    expect(mockOnClick).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("applies custom className", () => {
    render(
      <Button appName="test-app" className="bg-blue-500 text-white">
        Custom Style
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-blue-500");
    expect(button).toHaveClass("text-white");
  });

  it("applies default styling classes", () => {
    render(<Button appName="test-app">Default Style</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("rounded-md");
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
    expect(button).toHaveClass("font-medium");
  });

  it("merges custom className with default styles", () => {
    render(
      <Button appName="test-app" className="custom-class">
        Merged Styles
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("rounded-md");
    expect(button).toHaveClass("custom-class");
  });

  it("renders with type=button by default", () => {
    render(<Button appName="test-app">Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("passes through native button props", () => {
    render(
      <Button appName="test-app" id="custom-id" data-testid="custom-button" aria-label="Custom Button">
        Props Test
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("id", "custom-id");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveAttribute("aria-label", "Custom Button");
  });

  it("renders ReactNode children", () => {
    render(
      <Button appName="test-app">
        <span>Icon</span> Text
      </Button>,
    );
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("handles different appName values", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { rerender } = render(<Button appName="App1">Button</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(alertSpy).toHaveBeenCalledWith("Hello from your App1 app!");

    rerender(<Button appName="App2">Button</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(alertSpy).toHaveBeenCalledWith("Hello from your App2 app!");

    alertSpy.mockRestore();
  });

  it("prevents click when disabled", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const mockOnClick = vi.fn();

    render(
      <Button appName="test-app" disabled onClick={mockOnClick}>
        Disabled
      </Button>,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Native disabled buttons don't fire click events
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("handles empty children gracefully", () => {
    render(<Button appName="test-app">{""}</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("works without custom onClick handler", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<Button appName="test-app">No Custom Click</Button>);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(alertSpy).toHaveBeenCalledWith("Hello from your test-app app!");
    alertSpy.mockRestore();
  });

  it("receives click event in custom onClick handler", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const mockOnClick = vi.fn();

    render(
      <Button appName="test-app" onClick={mockOnClick}>
        Event Test
      </Button>,
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick.mock.calls[0][0]).toBeInstanceOf(Object); // Click event object

    alertSpy.mockRestore();
  });
});
