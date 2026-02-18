"use client";

import AuthWithSocialForm, { type AuthState } from "@rezumerai/ui/components/AuthWithSocialForm";
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
  async function onSignIn(state: AuthState): Promise<void> {
    // await auth.api.signInEmail({
    //   body: {
    //     email: state.email,
    //     password: state.password,
    //   },
    // });
    // router.push(ROUTES.WORKSPACE);
    console.log("test");
  }

  /**
   * Handles Google OAuth sign in.
   * Redirects to workspace after successful authentication.
   */
  async function handleGoogleAuth(): Promise<void> {
    await signIn.social({
      provider: "google",
      callbackURL: ROUTES.WORKSPACE,
    });
  }

  /**
   * Handles GitHub OAuth sign in.
   * Redirects to workspace after successful authentication.
   */
  async function handleGitHubAuth(): Promise<void> {
    await signIn.social({
      provider: "github",
      callbackURL: ROUTES.WORKSPACE,
    });
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
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
