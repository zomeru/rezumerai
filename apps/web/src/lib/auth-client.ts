import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_SITE_URL,
});

export const { changePassword, signIn, signOut, signUp, useSession } = authClient;
