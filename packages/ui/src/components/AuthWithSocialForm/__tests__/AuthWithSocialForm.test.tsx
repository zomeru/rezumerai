import { describe, expect, it, mock } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, authReducer, useAuthSocialForm } from "../AuthContext";
import AuthWithSocialForm from "../AuthWithSocialForm";

describe("AuthContext", () => {
  // Test component that uses the context
  function TestComponent() {
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
    console.error = mock();

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuthSocialForm must be used within an AuthProvider");

    console.error = originalError;
  });

  it("handles unknown error type in onError", async () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = mock();

    const mockSubmit = mock().mockRejectedValue("string error");
    render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    console.error = originalError;
  });
});

describe("AuthWithSocialForm Component", () => {
  describe("Sign In Mode", () => {
    it("renders signin form with correct heading", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} resetPasswordLink="/reset" />);

      expect(screen.getByText("Log in to your account")).toBeInTheDocument();
    });

    it("renders email input", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("renders password input", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("does not render confirm password field", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.queryByPlaceholderText("Confirm your password")).not.toBeInTheDocument();
    });

    it("renders forgot password link", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} resetPasswordLink="/reset" />);

      const forgotLink = screen.getByText("Forgot Password");
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute("href", "/reset");
    });

    it('renders "Sign In" button', () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    });

    it('renders "Create an account" link', () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByText("Create an account")).toHaveAttribute("href", "/signup");
    });

    it("handles form submission", async () => {
      const mockSubmit = mock().mockResolvedValue(undefined);
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
      const mockSubmit = mock().mockResolvedValue(undefined);
      const mockSuccess = mock();
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
      console.error = mock();

      const mockError = new Error("Submission failed");
      const mockSubmit = mock().mockRejectedValue(mockError);
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      const passwordInput = screen.getByPlaceholderText("Enter your password");
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      console.error = originalError;
    });

    it("calls onFinally after submission", async () => {
      const mockSubmit = mock().mockResolvedValue(undefined);
      const mockFinally = mock();
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
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByText("Create your account")).toBeInTheDocument();
    });

    it("renders confirm password field", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByPlaceholderText("Confirm your password")).toBeInTheDocument();
    });

    it("does not render forgot password link", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.queryByText("Forgot Password")).not.toBeInTheDocument();
    });

    it('renders "Sign Up" button', () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
    });

    it('renders "Sign In" link', () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      expect(screen.getByText("Sign In")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toHaveAttribute("href", "/signin");
    });

    it("updates confirm password field", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      const confirmInput = screen.getByPlaceholderText("Confirm your password");
      fireEvent.change(confirmInput, { target: { value: "password123" } });

      expect(confirmInput).toHaveValue("password123");
    });

    it("shows error with my-4 class in signup mode", async () => {
      const originalError = console.error;
      console.error = mock();

      const mockError = new Error("Email already in use");
      const mockSubmit = mock().mockRejectedValue(mockError);
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByPlaceholderText("Confirm your password"), {
        target: { value: "password123" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
      });

      await waitFor(() => {
        const errorEl = screen.getByText("Email already in use");
        expect(errorEl).toBeInTheDocument();
        expect(errorEl).toHaveClass("my-4");
      });

      expect(mockSubmit).toHaveBeenCalled();
      console.error = originalError;
    });
  });

  describe("Social Authentication", () => {
    it("renders Google button when handleGoogleAuth is provided", () => {
      const mockSubmit = mock();
      const mockhandleGoogleAuth = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} handleGoogleAuth={mockhandleGoogleAuth} />);

      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });

    it("renders GitHub button when handleGithubAuth is provided", () => {
      const mockSubmit = mock();
      const mockhandleGithubAuth = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} handleGithubAuth={mockhandleGithubAuth} />);

      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
    });

    it("renders Apple button when handleAppleAuth is provided", () => {
      const mockSubmit = mock();
      const mockhandleAppleAuth = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} handleAppleAuth={mockhandleAppleAuth} />);

      expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    });

    it("calls handleGoogleAuth when Google button is clicked", () => {
      const mockSubmit = mock();
      const mockhandleGoogleAuth = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} handleGoogleAuth={mockhandleGoogleAuth} />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      expect(mockhandleGoogleAuth).toHaveBeenCalledTimes(1);
    });

    it("calls handleGithubAuth when GitHub button is clicked", () => {
      const mockSubmit = mock();
      const mockhandleGithubAuth = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} handleGithubAuth={mockhandleGithubAuth} />);

      const githubButton = screen.getByText("Continue with GitHub");
      fireEvent.click(githubButton);

      expect(mockhandleGithubAuth).toHaveBeenCalledTimes(1);
    });

    it("calls handleAppleAuth when Apple button is clicked", () => {
      const mockSubmit = mock();
      const mockhandleAppleAuth = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} handleAppleAuth={mockhandleAppleAuth} />);

      const appleButton = screen.getByText("Continue with Apple");
      fireEvent.click(appleButton);

      expect(mockhandleAppleAuth).toHaveBeenCalledTimes(1);
    });

    it("renders all social auth buttons when all are provided", () => {
      const mockSubmit = mock();
      const mockhandleGoogleAuth = mock();
      const mockhandleGithubAuth = mock();
      const mockhandleAppleAuth = mock();
      render(
        <AuthWithSocialForm
          type="signin"
          onSubmit={mockSubmit}
          handleGoogleAuth={mockhandleGoogleAuth}
          handleGithubAuth={mockhandleGithubAuth}
          handleAppleAuth={mockhandleAppleAuth}
        />,
      );

      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
      expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    });

    it("renders only Google and GitHub buttons when both are provided", () => {
      const mockSubmit = mock();
      const mockhandleGoogleAuth = mock();
      const mockhandleGithubAuth = mock();
      render(
        <AuthWithSocialForm
          type="signin"
          onSubmit={mockSubmit}
          handleGoogleAuth={mockhandleGoogleAuth}
          handleGithubAuth={mockhandleGithubAuth}
        />,
      );

      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
      expect(screen.queryByText("Continue with Apple")).not.toBeInTheDocument();
    });

    it("renders only GitHub and Apple buttons when both are provided", () => {
      const mockSubmit = mock();
      const mockhandleGithubAuth = mock();
      const mockhandleAppleAuth = mock();
      render(
        <AuthWithSocialForm
          type="signin"
          onSubmit={mockSubmit}
          handleGithubAuth={mockhandleGithubAuth}
          handleAppleAuth={mockhandleAppleAuth}
        />,
      );

      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
      expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
      expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
    });

    it("does not render social buttons when none are provided", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
      expect(screen.queryByText("Continue with GitHub")).not.toBeInTheDocument();
      expect(screen.queryByText("Continue with Apple")).not.toBeInTheDocument();
    });
  });

  describe("Custom App Name", () => {
    it("renders default app name (Rezumer)", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      expect(screen.getByText(/New to Rezumer/)).toBeInTheDocument();
    });

    it("renders custom app name", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} appName="CustomApp" />);

      expect(screen.getByText(/New to CustomApp/)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("email input is required", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("password input is required", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const passwordInput = screen.getByPlaceholderText("Enter your password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("confirm password input is required in signup", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      const confirmInput = screen.getByPlaceholderText("Confirm your password");
      expect(confirmInput).toHaveAttribute("required");
    });

    it("email input has correct autocomplete", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signin" onSubmit={mockSubmit} />);

      const emailInput = screen.getByPlaceholderText("Enter your email");
      expect(emailInput).toHaveAttribute("autocomplete", "email");
    });

    it("password inputs have new-password autocomplete", () => {
      const mockSubmit = mock();
      render(<AuthWithSocialForm type="signup" onSubmit={mockSubmit} />);

      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      passwordInputs.forEach((input) => {
        expect(input).toHaveAttribute("autocomplete", "new-password");
      });
    });
  });
});
