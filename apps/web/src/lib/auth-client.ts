import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env";

type CreateAuthClient = ReturnType<typeof createAuthClient>;
export const { signIn, signUp, signOut, useSession }: CreateAuthClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_SITE_URL,
});
