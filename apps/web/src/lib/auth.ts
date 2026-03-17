import { hash, type Options, verify } from "@node-rs/argon2";
import { prisma } from "@rezumerai/database";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@rezumerai/types";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { anonymous } from "better-auth/plugins/anonymous";
import { getServerEnv } from "@/env";
import { formatPasswordCooldownMessage, getPasswordManagementState } from "./password-policy";

const argon2Options: Options = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3, // 3 iterations
  parallelism: 4, // 4 parallel lanes
  outputLen: 32, // 32 byte output
  algorithm: 2, // Argon2id variant
};

// Inferred type — do NOT add an explicit ReturnType<typeof betterAuth> annotation.
// betterAuth({...specific config...}) returns Auth<SpecificConfig>, not Auth<BetterAuthOptions>,
// and the explicit annotation causes a TS2322 incompatibility.
let _auth: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  const env = getServerEnv();
  return betterAuth({
    basePath: "/api/auth",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    account: {
      encryptOAuthTokens: true, // Uses AES-256-GCM
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      password: {
        hash: (password) => hash(password, argon2Options),
        verify: ({ password, hash: storedHash }) => verify(storedHash, password, argon2Options),
      },
    },
    socialProviders: {
      github: {
        clientId: env.BETTER_AUTH_GITHUB_CLIENT_ID,
        clientSecret: env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
        scope: ["read:user", "user:email"],
      },
    },
    plugins: [
      anonymous(),
      admin({
        defaultRole: "USER",
        adminRoles: ["ADMIN"],
        roles: {
          ADMIN: adminAc,
          USER: userAc,
        },
      }),
      {
        id: "rezumerai-password-change-policy",
        schema: {
          user: {
            fields: {
              lastPasswordChangeAt: {
                type: "date",
                required: false,
                input: false,
              },
            },
          },
        },
        hooks: {
          before: [
            {
              matcher(context) {
                return context.path === "/change-password";
              },
              handler: createAuthMiddleware(async (ctx) => {
                const session = ctx.context.session ?? (await getSessionFromCtx(ctx));
                const userId = session?.user?.id;

                if (!userId) {
                  return;
                }

                const user = await prisma.user.findUnique({
                  where: { id: userId },
                  select: {
                    lastPasswordChangeAt: true,
                  },
                });

                if (!user?.lastPasswordChangeAt) {
                  return;
                }

                const policy = getPasswordManagementState({
                  hasCredentialProvider: true,
                  isOAuthOnly: false,
                  lastPasswordChangeAt: user.lastPasswordChangeAt,
                });

                if (!policy.isCooldownActive || !policy.nextAllowedAt) {
                  return;
                }

                throw APIError.from("BAD_REQUEST", {
                  code: "PASSWORD_CHANGE_COOLDOWN_ACTIVE",
                  message: formatPasswordCooldownMessage(new Date(policy.nextAllowedAt)),
                });
              }),
            },
          ],
          after: [
            {
              matcher(context) {
                return context.path === "/change-password";
              },
              handler: createAuthMiddleware(async (ctx) => {
                if (!ctx.context.returned) {
                  return;
                }

                const userId = ctx.context.newSession?.user.id ?? ctx.context.session?.user.id;

                if (!userId) {
                  return;
                }

                await prisma.user.update({
                  where: { id: userId },
                  data: {
                    lastPasswordChangeAt: new Date(),
                  },
                });
              }),
            },
          ],
        },
      },
      nextCookies(),
    ],
  });
}

export function getAuth() {
  if (!_auth) _auth = createAuth();
  return _auth;
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_, prop) {
    return (getAuth() as Record<string | symbol, unknown>)[prop];
  },
});

export async function setManagedUserPassword(
  userId: string,
  newPassword: string,
  headers?: HeadersInit,
): Promise<{ createdCredentialAccount: boolean }> {
  const authContext = await auth.$context;
  const accounts = await authContext.internalAdapter.findAccounts(userId);
  const credentialAccount = accounts.find((account) => account.providerId === "credential");
  const legacyCredentialAccount = accounts.find((account) => account.providerId === "email-password");
  const passwordHash = await authContext.password.hash(newPassword);

  if (credentialAccount) {
    if (headers) {
      await auth.api.setUserPassword({
        headers,
        body: {
          userId,
          newPassword,
        },
      });
    } else {
      await authContext.internalAdapter.updatePassword(userId, passwordHash);
    }
  } else if (legacyCredentialAccount) {
    await authContext.internalAdapter.updateAccount(legacyCredentialAccount.id, {
      password: passwordHash,
    });
  } else {
    await authContext.internalAdapter.linkAccount({
      userId,
      providerId: "credential",
      accountId: userId,
      password: passwordHash,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastPasswordChangeAt: new Date(),
    },
  });

  return {
    createdCredentialAccount: !credentialAccount && !legacyCredentialAccount,
  };
}
