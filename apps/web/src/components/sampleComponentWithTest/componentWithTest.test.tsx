import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/utils";
import SampleComponentWithTest from "./componentWithTest";

const { mockHealthGet, mockUsersGet, mockUsersPost } = vi.hoisted(() => ({
  mockHealthGet: vi.fn(),
  mockUsersGet: vi.fn(),
  mockUsersPost: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    health: { get: mockHealthGet },
    users: {
      get: mockUsersGet,
      post: mockUsersPost,
    },
  },
}));

beforeEach(() => {
  mockHealthGet.mockResolvedValue({ data: null, error: null });
  mockUsersGet.mockResolvedValue({ data: null, error: null });
  mockUsersPost.mockResolvedValue({ data: null, error: null });
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

  it("shows unhealthy status when health API returns no data", async () => {
    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByText(/❌ Unhealthy/)).toBeInTheDocument();
    });
  });

  it("shows healthy status and health details when API returns data", async () => {
    mockHealthGet.mockResolvedValueOnce({
      data: { data: { message: "All systems go", server: "bun-v1", timestamp: "2024-01-01" } },
      error: null,
    });

    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByText(/✅ Healthy/)).toBeInTheDocument();
      expect(screen.getByText("Message: All systems go")).toBeInTheDocument();
      expect(screen.getByText("Server: bun-v1")).toBeInTheDocument();
      expect(screen.getByText("Timestamp: 2024-01-01")).toBeInTheDocument();
    });
  });

  it("renders create user form after users load", async () => {
    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create User" })).toBeInTheDocument();
    });
  });

  it("renders user cards when users are returned", async () => {
    mockUsersGet.mockResolvedValueOnce({
      data: { data: [{ id: "1", name: "Alice Smith", email: "alice@example.com" }] },
      error: null,
    });

    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });
  });

  it("handles create user form submission", async () => {
    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Bob Jones" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "bob@example.com" } });

    const input = screen.getByPlaceholderText("Name");
    const form = input.closest("form");

    if (!form) {
      throw new Error("Form not found");
    }

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockUsersPost).toHaveBeenCalled();
  });

  it("shows projects section with empty state after loading", async () => {
    renderWithProviders(<SampleComponentWithTest />);

    await waitFor(() => {
      expect(screen.getByText("No projects yet (endpoint not migrated).")).toBeInTheDocument();
    });
  });
});
