"use client";

import AuthWithSocialForm, { type AuthState } from "@rezumerai/ui/components/AuthWithSocialForm";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Logo } from "@/components";
import { ROUTES } from "@/constants/routing";

/**
 * Sign-in page with social authentication and credential-based login.
 * Supports email/password authentication, Google OAuth, and GitHub OAuth.
 */
export default function SignIn(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles credential-based sign in with email and password.
   * Validates input and redirects to workspace on success.
   */
  async function onSignIn(state: AuthState): Promise<void> {
    setError(null);

    const result = await signIn("credentials", {
      email: state.email,
      password: state.password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      throw new Error(result.error);
    }

    router.push(ROUTES.WORKSPACE);
  }

  /**
   * Handles Google OAuth sign in.
   * Redirects to workspace after successful authentication.
   */
  async function handleGoogleAuth(): Promise<void> {
    await signIn("google", { callbackUrl: ROUTES.WORKSPACE });
  }

  /**
   * Handles GitHub OAuth sign in.
   * Redirects to workspace after successful authentication.
   */
  async function handleGitHubAuth(): Promise<void> {
    await signIn("github", { callbackUrl: ROUTES.WORKSPACE });
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
        type="signin"
        onSubmit={onSignIn}
        googleAuth={handleGoogleAuth}
        githubAuth={handleGitHubAuth}
        resetPasswordLink="/reset-password"
      />
    </main>
  );
}
