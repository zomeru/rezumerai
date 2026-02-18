import { prisma } from "@rezumerai/database";
import { type Auth, type BetterAuthOptions, betterAuth, type DBAdapter } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { env } from "@/env";

export const auth: Auth<{
  database: (options: BetterAuthOptions) => DBAdapter<BetterAuthOptions>;
}> = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
      scope: ["read:user", "user:email"],
    },
  },
  plugins: [nextCookies()],
});
