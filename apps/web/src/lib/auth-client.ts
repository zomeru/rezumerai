import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_SITE_URL,
});
