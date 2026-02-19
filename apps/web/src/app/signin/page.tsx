"use client";

import AuthWithSocialForm, { type AuthState } from "@rezumerai/ui/components/AuthWithSocialForm";
import { useCallback } from "react";
import { Logo } from "@/components";
import { ROUTES } from "@/constants/routing";
import { signIn } from "@/lib/auth-client";

/**
 * Sign-in page with social authentication and credential-based login.
 * Supports email/password authentication, Google OAuth, and GitHub OAuth.
 */
export default function SignIn(): React.JSX.Element {
  /**
   * Handles credential-based sign in with email and password.
   * Validates input and redirects to workspace on success.
   */
  const onSignIn = useCallback(async (state: AuthState): Promise<void> => {
    const { error } = await signIn.email({
      email: state.email,
      password: state.password,
      callbackURL: ROUTES.WORKSPACE,
    });

    if (error) {
      const message = error.message ?? "Invalid email or password";
      throw new Error(message);
    }
  }, []);

  /**
   * Handles Google OAuth sign in.
   * Redirects to workspace after successful authentication.
   * Currently commented out pending Google OAuth setup and testing.
   */
  // const handleGoogleAuth = useCallback(async (): Promise<void> => {
  //   await signIn.social({
  //     provider: "google",
  //     callbackURL: ROUTES.WORKSPACE,
  //   });
  // }, []);

  /**
   * Handles GitHub OAuth sign in.
   * Redirects to workspace after successful authentication.
   */
  const handleGithubAuth = useCallback(async (): Promise<void> => {
    await signIn.social({
      provider: "github",
      callbackURL: ROUTES.WORKSPACE,
    });
  }, []);

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      <AuthWithSocialForm
        type="signin"
        onSubmit={onSignIn}
        // handleGoogleAuth={handleGoogleAuth}
        handleGithubAuth={handleGithubAuth}
        resetPasswordLink="/reset-password"
      />
    </main>
  );
}
