"use client";

import AuthWithSocialForm from "@rezumerai/ui/components/AuthWithSocialForm";
import { Logo } from "@/components";

/**
 * Sign-up page with social authentication form.
 */
export default function SignUp(): React.JSX.Element {
  async function onSignUp(): Promise<void> {}

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      <AuthWithSocialForm type="signup" onSubmit={onSignUp} />
    </main>
  );
}
