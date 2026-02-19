"use client";

import AuthWithSocialForm, { type AuthState } from "@rezumerai/ui/components/AuthWithSocialForm";
import { Logo } from "@/components";
import { ROUTES } from "@/constants/routing";
import { signIn, signUp } from "@/lib/auth-client";

/**
 * Sign-up page with credential-based registration and GitHub OAuth.
 * Creates new user accounts via Better Auth and redirects to workspace.
 */
export default function SignUp() {
  /**
   * Handles user registration with email and password via Better Auth.
   * Validates password requirements before submitting to the auth server.
   */
  async function onSignUp(state: AuthState): Promise<void> {
    if (state.password.length < 8) {
      const message = "Password must be at least 8 characters";
      throw new Error(message);
    }

    if (state.password !== state.confirmPassword) {
      const message = "Passwords do not match";
      throw new Error(message);
    }

    const { error: signUpError } = await signUp.email({
      email: state.email,
      password: state.password,
      name: state.email.split("@")[0] || "",
      callbackURL: ROUTES.WORKSPACE,
    });

    if (signUpError) {
      const message = signUpError.message ?? "Failed to create account";
      throw new Error(message);
    }
  }

  /**
   * Handles GitHub OAuth sign up via Better Auth social provider.
   */
  async function handleGithubAuth(): Promise<void> {
    await signIn.social({
      provider: "github",
      callbackURL: ROUTES.WORKSPACE,
    });
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      <AuthWithSocialForm type="signup" onSubmit={onSignUp} handleGithubAuth={handleGithubAuth} />
    </main>
  );
}
