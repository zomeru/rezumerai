import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils";
import { UserFetcher } from "../user-fetcher";

const mockUsersGet = mock();

mock.module("@/lib/api", () => ({
  api: {
    users: mock().mockReturnValue({ get: mockUsersGet }),
  },
}));

beforeEach(() => {
  mockUsersGet.mockResolvedValue({ data: null, error: null });
});

describe("UserFetcher", () => {
  it("renders initial state with input, button and prompt", () => {
    renderWithProviders(<UserFetcher />);

    expect(screen.getByText("Fetch Individual User")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter user ID (e.g., 1, 2, 3)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fetch User" })).toBeInTheDocument();
    expect(screen.getByText(/Enter a user ID and click/)).toBeInTheDocument();
  });

  it("accepts optional className prop", () => {
    const { container } = renderWithProviders(<UserFetcher className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("updates userId when input changes", () => {
    renderWithProviders(<UserFetcher />);

    const input = screen.getByPlaceholderText("Enter user ID (e.g., 1, 2, 3)");
    fireEvent.change(input, { target: { value: "42" } });

    expect(input).toHaveValue("42");
  });

  it("shows loading state then prompt when fetch returns no data", async () => {
    renderWithProviders(<UserFetcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fetch User" }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Enter a user ID and click/)).toBeInTheDocument();
    });
  });

  it("shows loading indicator during fetch", async () => {
    let resolveGet!: (value: unknown) => void;
    mockUsersGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );

    renderWithProviders(<UserFetcher />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Fetch User" }));
    });

    expect(screen.getByText("Loading user...")).toBeInTheDocument();

    await act(async () => {
      resolveGet({ data: null, error: null });
    });
  });

  it("shows user card when fetch returns user data", async () => {
    mockUsersGet.mockResolvedValueOnce({
      data: { data: { id: "1", name: "Jane Doe", email: "jane@example.com" } },
      error: null,
    });

    renderWithProviders(<UserFetcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fetch User" }));
    });

    await waitFor(() => {
      expect(screen.getByText("User Details")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("shows specific error message when error object has error property", async () => {
    mockUsersGet.mockResolvedValueOnce({
      data: null,
      error: { error: "User with that ID does not exist" },
    });

    renderWithProviders(<UserFetcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fetch User" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Error: User with that ID does not exist")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when error is not an object with error property", async () => {
    mockUsersGet.mockResolvedValueOnce({
      data: null,
      error: "unexpected string error",
    });

    renderWithProviders(<UserFetcher />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fetch User" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Error: User not found")).toBeInTheDocument();
    });
  });
});
