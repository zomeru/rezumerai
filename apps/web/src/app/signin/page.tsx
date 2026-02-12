"use client";

import AuthWithSocialForm from "@rezumerai/ui/components/AuthWithSocialForm";
import Image from "next/image";
import { Logo } from "@/components";

/**
 * Sign-in page with social authentication form.
 */
export default function SignIn(): React.JSX.Element {
  async function onSignIn(): Promise<void> {}

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      <AuthWithSocialForm type="signin" onSubmit={onSignIn} NextImage={Image} />
    </main>
  );
}
