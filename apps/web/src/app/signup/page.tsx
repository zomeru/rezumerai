"use client";

import AuthWithSocialForm from "@rezumerai/ui/components/AuthWithSocialForm";
import { Logo } from "@/components";

export default function SignUp() {
  async function onSignUp() {}

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      <AuthWithSocialForm type="signup" onSubmit={onSignUp} />
    </div>
  );
}
