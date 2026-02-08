import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/utils";
import SampleComponentWithTest from "./componentWithTest";

// Mock the Eden treaty API client so tests don't make real HTTP calls
vi.mock("@/lib/api", () => {
  const mockGet = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockPost = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    api: {
      api: {
        health: { get: mockGet },
        users: {
          get: mockGet,
          post: mockPost,
          // Dynamic param route: api.api.users({ id }).get()
          __call: vi.fn().mockReturnValue({ get: mockGet }),
        },
      },
    },
  };
});

describe("SampleComponentWithTest Page", () => {
  it("renders the welcome text", async () => {
    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByText("Welcome to rezumerai")).toBeInTheDocument();
    });
  });

  it("renders the get started button", async () => {
    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });
  });

  it("renders a div container", async () => {
    const { container } = renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
      expect(container.firstChild).toHaveClass("p-8");
    });
  });
});
