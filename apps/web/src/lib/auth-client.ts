import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

type CreateAuthClient = ReturnType<typeof createAuthClient>;
export const { signIn, signUp, signOut, useSession }: CreateAuthClient = createAuthClient({
  baseURL: env.BETTER_AUTH_URL,
});
