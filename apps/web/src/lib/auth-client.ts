import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env";

function getClientBaseUrl(): string {
  return clientEnv.NEXT_PUBLIC_SITE_URL;
}

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
});

export const { changePassword, signIn, signOut, signUp, useSession } = authClient;
