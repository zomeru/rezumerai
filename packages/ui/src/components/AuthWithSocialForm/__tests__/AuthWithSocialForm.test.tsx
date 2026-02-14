import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, authReducer, useAuthSocialForm } from "../AuthContext";
import AuthWithSocialForm from "../AuthWithSocialForm";

describe("AuthContext", () => {
  // Test component that uses the context
  function TestComponent(): React.JSX.Element {
    const { state, setEmail, setPassword, setConfirmPassword, reset } = useAuthSocialForm();
    return (
      <div>
        <div data-testid="email">{state.email}</div>
        <div data-testid="password">{state.password}</div>
        <div data-testid="confirmPassword">{state.confirmPassword}</div>
        <input
          data-testid="email-input"
          value={state.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e)}
        />
        <input
          data-testid="password-input"
          value={state.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e)}
        />
        <input
          data-testid="confirm-input"
          value={state.confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e)}
        />
        <button type="button" data-testid="reset-button" onClick={reset}>
          Reset
        </button>
      </div>
    );
  }

  it("provides initial state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("email")).toHaveTextContent("");
    expect(screen.getByTestId("password")).toHaveTextContent("");
    expect(screen.getByTestId("confirmPassword")).toHaveTextContent("");
  });

  it("updates email state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const emailInput = screen.getByTestId("email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");
  });

  it("updates password state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const passwordInput = screen.getByTestId("password-input");
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(screen.getByTestId("password")).toHaveTextContent("password123");
  });

  it("updates confirmPassword state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const confirmInput = screen.getByTestId("confirm-input");
    fireEvent.change(confirmInput, { target: { value: "password123" } });

    expect(screen.getByTestId("confirmPassword")).toHaveTextContent("password123");
  });

  it("resets all state to initial values", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");
    const confirmInput = screen.getByTestId("confirm-input");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "password123" } });

    expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");

    const resetButton = screen.getByTestId("reset-button");
    fireEvent.click(resetButton);

    expect(screen.getByTestId("email")).toHaveTextContent("");
    expect(screen.getByTestId("password")).toHaveTextContent("");
    expect(screen.getByTestId("confirmPassword")).toHaveTextContent("");
  });

  it("provides context value when wrapped in AuthProvider", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("email")).toBeInTheDocument();
  });

  it("handles default case in reducer (coverage test)", () => {
    // This tests the default case which is technically unreachable with TypeScript
    // but exists for defensive programming
    const state = { email: "test@example.com", password: "pass", confirmPassword: "pass" };
    // @ts-expect-error - Testing unreachable default case for coverage
    const result = authReducer(state, { type: "UNKNOWN" });
    expect(result).toEqual(state);
  });

  it("throws error when useAuthSocialForm is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuthSocialForm must be used within an AuthProvider");

    console.error = originalError;
  });

  it("handles unknown error type in onError", async () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    const mockSubmit = vi.fn().mockRejectedValue("string error");
    const mockErrorHandler = vi.fn();
    render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} onError={mockErrorHandler} />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(Error));
      expect(mockErrorHandler.mock.calls[0][0].message).toBe("Unknown error occurred");
    });

    console.error = originalError;
  });
});

describe("AuthWithSocialForm Component", () => {
  describe("Sign In Mode", () => {
    it("renders signin form with correct heading", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} resetPasswordLink="/reset" />);

      expect(screen.getByText("Log in to your account")).toBeInTheDocument();
    });

    it("renders email input", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("renders password input", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("does not render confirm password field", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.queryByPlaceholderText("Confirm your password")).not.toBeInTheDocument();
    });

    it("renders forgot password link", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} resetPasswordLink="/reset" />);

      const forgotLink = screen.getByText("Forgot Password");
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute("href", "/reset");
    });

    it('renders "Sign In" button', () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    });

    it('renders "Create an account" link', () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByText("Create an account")).toHaveAttribute("href", "/signup");
    });

    it("handles form submission", async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });

    it("calls onSuccess after successful submission", async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      const mockSuccess = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} onSuccess={mockSuccess} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalled();
      });
    });

    it("calls onError when submission fails", async () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      const mockError = new Error("Submission failed");
      const mockSubmit = vi.fn().mockRejectedValue(mockError);
      const mockErrorHandler = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} onError={mockErrorHandler} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
      });

      console.error = originalError;
    });

    it("calls onFinally after submission", async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      const mockFinally = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} onFinally={mockFinally} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockFinally).toHaveBeenCalled();
      });
    });
  });

  describe("Sign Up Mode", () => {
    it("renders signup form with correct heading", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });

    it("renders confirm password field", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByPlaceholderText("Confirm your password")).toBeInTheDocument();
    });

    it("does not render forgot password link", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.queryByText("Forgot Password")).not.toBeInTheDocument();
    });

    it('renders "Sign Up" button', () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    });

    it('renders "Sign In" link', () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toHaveAttribute("href", "/signin");
    });

    it("updates confirm password field", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      const confirmInput = screen.getByPlaceholderText("Confirm your password");
      fireEvent.change(confirmInput, { target: { value: "password123" } });

      expect(confirmInput).toHaveValue("password123");
    });
  });

  describe("Social Authentication", () => {
    it("renders Google button when googleAuth is provided", () => {
      const mockSubmit = vi.fn();
      const mockGoogleAuth = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} googleAuth={mockGoogleAuth} />);

      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });

    it("renders GitHub button when githubAuth is provided", () => {
      const mockSubmit = vi.fn();
      const mockGitHubAuth = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} githubAuth={mockGitHubAuth} />);

      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
    });

    it("renders Apple button when appleAuth is provided", () => {
      const mockSubmit = vi.fn();
      const mockAppleAuth = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} appleAuth={mockAppleAuth} />);

      expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    });

    it("calls googleAuth when Google button is clicked", () => {
      const mockSubmit = vi.fn();
      const mockGoogleAuth = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} googleAuth={mockGoogleAuth} />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      expect(mockGoogleAuth).toHaveBeenCalledTimes(1);
    });

    it("calls githubAuth when GitHub button is clicked", () => {
      const mockSubmit = vi.fn();
      const mockGitHubAuth = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} githubAuth={mockGitHubAuth} />);

      const githubButton = screen.getByText("Continue with GitHub");
      fireEvent.click(githubButton);

      expect(mockGitHubAuth).toHaveBeenCalledTimes(1);
    });

    it("calls appleAuth when Apple button is clicked", () => {
      const mockSubmit = vi.fn();
      const mockAppleAuth = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} appleAuth={mockAppleAuth} />);

      const appleButton = screen.getByText("Continue with Apple");
      fireEvent.click(appleButton);

      expect(mockAppleAuth).toHaveBeenCalledTimes(1);
    });

    it("renders all social auth buttons when all are provided", () => {
      const mockSubmit = vi.fn();
      const mockGoogleAuth = vi.fn();
      const mockGitHubAuth = vi.fn();
      const mockAppleAuth = vi.fn();
      render(
        <AuthWithSocialForm
          type="signin"
          onSubmit={mockSubmit}
          googleAuth={mockGoogleAuth}
          githubAuth={mockGitHubAuth}
          appleAuth={mockAppleAuth}
        />,
      );

      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
      expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    });

    it("renders only Google and GitHub buttons when both are provided", () => {
      const mockSubmit = vi.fn();
      const mockGoogleAuth = vi.fn();
      const mockGitHubAuth = vi.fn();
      render(
        <AuthWithSocialForm
          type="signin"
          onSubmit={mockSubmit}
          googleAuth={mockGoogleAuth}
          githubAuth={mockGitHubAuth}
        />,
      );

      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
      expect(screen.queryByText("Continue with Apple")).not.toBeInTheDocument();
    });

    it("renders only GitHub and Apple buttons when both are provided", () => {
      const mockSubmit = vi.fn();
      const mockGitHubAuth = vi.fn();
      const mockAppleAuth = vi.fn();
      render(
        <AuthWithSocialForm
          type="signin"
          onSubmit={mockSubmit}
          githubAuth={mockGitHubAuth}
          appleAuth={mockAppleAuth}
        />,
      );

      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
      expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
      expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
    });

    it("does not render social buttons when none are provided", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
      expect(screen.queryByText("Continue with GitHub")).not.toBeInTheDocument();
      expect(screen.queryByText("Continue with Apple")).not.toBeInTheDocument();
    });
  });

  describe("Custom App Name", () => {
    it("renders default app name (Rezumer)", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.getByText(/New to Rezumer/)).toBeInTheDocument();
    });

    it("renders custom app name", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} appName="CustomApp" />);

      expect(screen.getByText(/New to CustomApp/)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("email input is required", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("password input is required", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("confirm password input is required in signup", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      const confirmInput = screen.getByPlaceholderText("Confirm your password");
      expect(confirmInput).toHaveAttribute("required");
    });

    it("email input has correct autocomplete", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toHaveAttribute("autocomplete", "email");
    });

    it("password inputs have new-password autocomplete", () => {
      const mockSubmit = vi.fn();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      passwordInputs.forEach((input) => {
        expect(input).toHaveAttribute("autocomplete", "new-password");
      });
    });
  });
});
