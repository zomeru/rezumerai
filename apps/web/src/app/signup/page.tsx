"use client";

import AuthWithSocialForm, { type AuthState } from "@rezumerai/ui/components/AuthWithSocialForm";
// import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components";
// import { ROUTES } from "@/constants/routing";

/**
 * Sign-up page with credential-based registration, Google OAuth, and GitHub OAuth.
 * Creates new user accounts and automatically signs them in.
 */
export default function SignUp(): React.JSX.Element {
  // const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles user registration with email and password.
   * Validates password match, creates user, and signs them in.
   */
  async function onSignUp(state: AuthState): Promise<void> {
    setError(null);

    // Validate password confirmation
    // if (state.password !== state.confirmPassword) {
    //   setError("Passwords do not match");
    //   throw new Error("Passwords do not match");
    // }

    // if (state.password.length < 8) {
    //   setError("Password must be at least 8 characters");
    //   throw new Error("Password must be at least 8 characters");
    // }

    // try {
    //   // Create user account via API
    //   const response = await fetch("/api/auth/signup", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       email: state.email,
    //       password: state.password,
    //     }),
    //   });

    //   const data = await response.json();

    //   if (!response.ok) {
    //     throw new Error(data.error || "Failed to create account");
    //   }

    //   // Automatically sign in after successful registration
    //   const result = await signIn("credentials", {
    //     email: state.email,
    //     password: state.password,
    //     redirect: false,
    //   });

    //   if (result?.error) {
    //     setError(result.error);
    //     throw new Error(result.error);
    //   }

    //   router.push(ROUTES.WORKSPACE);
    // } catch (err) {
    //   const errorMessage = err instanceof Error ? err.message : "Failed to create account";
    //   setError(errorMessage);
    //   throw err;
    // }
  }

  /**
   * Handles Google OAuth sign up.
   * Redirects to workspace after successful authentication.
   */
  async function handleGoogleAuth(): Promise<void> {
    // await signIn("google", { callbackUrl: ROUTES.WORKSPACE });
  }

  /**
   * Handles GitHub OAuth sign up.
   * Redirects to workspace after successful authentication.
   */
  async function handleGitHubAuth(): Promise<void> {
    // await signIn("github", { callbackUrl: ROUTES.WORKSPACE });
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      {error && (
        <div className="max-w-96 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      <AuthWithSocialForm
        type="signup"
        onSubmit={onSignUp}
        googleAuth={handleGoogleAuth}
        githubAuth={handleGitHubAuth}
      />
    </main>
  );
}
