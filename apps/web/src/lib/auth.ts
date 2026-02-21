import { hash, type Options, verify } from "@node-rs/argon2";
import { prisma } from "@rezumerai/database";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { serverEnv } from "@/env";

if (!serverEnv) {
  throw new Error("Server environment variables are not defined");
}

const argon2Options: Options = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel lanes
  outputLen: 32, // 32 byte output
  algorithm: 2, // Argon2id variant
};

export const auth = betterAuth({
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  account: {
    encryptOAuthTokens: true, // Uses AES-256-GCM
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
    password: {
      hash: (password) => hash(password, argon2Options),
      verify: ({ password, hash: storedHash }) => verify(storedHash, password, argon2Options),
    },
  },
  socialProviders: {
    github: {
      clientId: serverEnv.BETTER_AUTH_GITHUB_CLIENT_ID,
      clientSecret: serverEnv.BETTER_AUTH_GITHUB_CLIENT_SECRET,
      scope: ["read:user", "user:email"],
    },
  },
  plugins: [nextCookies()],
});
