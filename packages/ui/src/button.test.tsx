import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

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
});
