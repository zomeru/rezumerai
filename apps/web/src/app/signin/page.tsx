"use client";

import AuthWithSocialForm from "@rezumerai/ui/components/AuthWithSocialForm";
import Image from "next/image";
import { Logo } from "@/components";

export default function SignIn(): React.JSX.Element {
  async function onSignIn(): Promise<void> {}

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center space-y-10">
      <Logo />
      <AuthWithSocialForm type="signin" onSubmit={onSignIn} NextImage={Image} />
    </div>
  );
}
