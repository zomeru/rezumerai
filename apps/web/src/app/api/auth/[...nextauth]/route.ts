/**
 * NextAuth API Route Handler
 *
 * Configures authentication for the Rezumer application with:
 * - Email/password credentials via CredentialsProvider
 * - Google OAuth via GoogleProvider
 * - GitHub OAuth via GitHubProvider
 * - JWT-based sessions for stateless authentication
 * - Manual user management via signIn callback (Prisma)
 *
 * @see https://next-auth.js.org/configuration/options
 */

import { prisma } from "@rezumerai/database";
import * as argon2 from "argon2";
import type { Account, Session, User } from "next-auth";
import NextAuth, { type AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider, { type GithubProfile } from "next-auth/providers/github";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import { env } from "@/env";

/**
 * Type definition for credential-based authentication.
 * Expects email and password fields from the login form.
 */
type Credentials = Record<"email" | "password", string> | undefined;

/**
 * NextAuth configuration options.
 *
 * Key features:
 * - **Providers**: Credentials (email/password), Google OAuth, and GitHub OAuth
 * - **Session**: JWT strategy for stateless sessions (no database lookups)
 * - **Callbacks**: Manual user/account management for account linking support
 *
 * Note: PrismaAdapter is NOT used to enable automatic account linking when
 * users sign in with OAuth using an email that already exists (credentials signup).
 *
 * @see https://next-auth.js.org/configuration/options#options
 */
const authOptions: AuthOptions = {
  providers: [
    /**
     * Credentials Provider - Email/Password Authentication
     *
     * Handles traditional username/password login flow:
     * 1. Validates email and password are provided
     * 2. Checks if user exists in database
     * 3. Prevents credential login for Google OAuth users
     * 4. Verifies password using Argon2
     * 5. Returns user data for session creation
     *
     * Security features:
     * - Argon2 password hashing (stronger than bcrypt)
     * - Provider-specific account protection
     * - Clear error messages for debugging
     *
     * @see https://next-auth.js.org/providers/credentials
     */
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Authorizes user credentials and returns user object.
       *
       * @param credentials - Email and password from login form
       * @returns User object if authentication succeeds, null otherwise
       * @throws Error with descriptive message if authentication fails
       */
      async authorize(credentials: Credentials): Promise<User | null> {
        // Validate required fields
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password.");
        }

        // Fetch user with Google account associations
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            accounts: {
              // where: { provider: "google" }
              // google or github accounts should not be able to use credentials login
              where: {
                provider: {
                  in: ["google", "github"],
                },
              },
            },
          },
        });

        // Check if user exists
        if (!user) throw new Error("Invalid email or password.");

        // Prevent credential login for Google OAuth users
        if (user.accounts.length > 0 || !user.password) {
          throw new Error(
            "This email is registered via Google or GitHub. Please use the corresponding OAuth provider to sign in.",
          );
        }

        // Verify password with Argon2
        const isValid = await argon2.verify(user.password, credentials.password);
        if (!isValid) throw new Error("Invalid email or password.");

        // Return NextAuth User object
        return {
          id: user.id,
          email: user.email ?? "",
          name: user.name ?? "",
          image: user.image ?? null,
        };
      },
    }),

    /**
     * Google OAuth Provider
     *
     * Enables "Sign in with Google" authentication:
     * 1. Redirects user to Google consent screen
     * 2. Google returns user profile data
     * 3. Profile callback maps Google data to NextAuth User format
     * 4. signIn callback handles database upsert
     *
     * Required environment variables:
     * - NEXTAUTH_GOOGLE_CLIENT_ID: OAuth client ID from Google Cloud Console
     * - NEXTAUTH_GOOGLE_CLIENT_SECRET: OAuth client secret
     *
     * @see https://next-auth.js.org/providers/google
     * @see https://console.cloud.google.com/apis/credentials
     */
    GoogleProvider({
      clientId: env.NEXTAUTH_GOOGLE_CLIENT_ID || "",
      clientSecret: env.NEXTAUTH_GOOGLE_CLIENT_SECRET || "",
      /**
       * Maps Google profile data to NextAuth User format.
       *
       * @param profile - Google user profile from OAuth response
       * @returns NextAuth User object with standardized fields
       */
      profile(profile: GoogleProfile): User {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),

    /**
     * GitHub OAuth Provider
     *
     * Enables "Sign in with GitHub" authentication:
     * 1. Redirects user to GitHub authorization page
     * 2. GitHub returns user profile data (including email via 'user:email' scope)
     * 3. User data is automatically mapped to NextAuth format
     * 4. signIn callback handles database upsert
     *
     * Required environment variables:
     * - NEXTAUTH_GITHUB_CLIENT_ID: OAuth app client ID from GitHub
     * - NEXTAUTH_GITHUB_CLIENT_SECRET: OAuth app client secret
     *
     * @see https://next-auth.js.org/providers/github
     * @see https://github.com/settings/developers
     */
    GitHubProvider({
      clientId: env.NEXTAUTH_GITHUB_CLIENT_ID,
      clientSecret: env.NEXTAUTH_GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile: GithubProfile): User {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email || "",
          image: profile.avatar_url,
        };
      },
    }),
  ],

  /**
   * Callbacks - Custom logic for authentication lifecycle events
   *
   * These callbacks allow customization of authentication behavior:
   * - **jwt**: Modify JWT token before signing
   * - **session**: Add custom data to session object
   * - **signIn**: Control sign-in authorization and side effects
   *
   * @see https://next-auth.js.org/configuration/callbacks
   */
  callbacks: {
    /**
     * JWT Callback - Customize JWT token
     *
     * Called whenever a JWT is created or updated.
     *
     * @param token - The JWT token object
     * @returns JWT token
     * @see https://next-auth.js.org/configuration/callbacks#jwt-callback
     */
    async jwt({ token, account }: { token: JWT; account: Account | null }): Promise<JWT> {
      if (account) {
        // Add access token from OAuth provider to JWT token
        token.accessToken = account.access_token as string;
      }
      return token;
    },

    /**
     * Session Callback - Customize session object
     *
     * Called whenever a session is checked (e.g., useSession, getSession).
     * Adds access token from JWT to the session object.
     *
     * @param session - The session object
     * @param token - The JWT token object
     * @returns Session object with access token included
     * @see https://next-auth.js.org/configuration/callbacks#session-callback
     */
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      // Add access token from JWT to session
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },

    /**
     * Sign In Callback - Control sign-in authorization and account linking
     *
     * Handles automatic account linking for OAuth providers:
     * - If user with email exists, links OAuth account to existing user
     * - If user doesn't exist, creates new user with OAuth data
     *
     * @param user - User object from provider
     * @param account - Account object with provider info
     * @returns true to allow sign-in, false to deny
     * @see https://next-auth.js.org/configuration/callbacks#sign-in-callback
     */
    async signIn({ user, account }: { user: User; account: Account | null }): Promise<boolean> {
      const isOAuthProvider = account?.provider === "google" || account?.provider === "github";

      // Skip if not OAuth provider
      if (!isOAuthProvider || !account) return true;

      // Require email for OAuth sign-in
      if (!user.email || user.email.trim() === "") {
        console.error(`${account.provider} sign-in failed: No email provided`);
        throw new Error(
          `Email is required for ${account.provider} sign-in. Please ensure your email is public in your ${account.provider} account settings.`,
        );
      }

      try {
        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // User exists - link OAuth account to existing user
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {},
            create: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });

          // Update user profile with OAuth data if not already set
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: existingUser.name || user.name,
              image: existingUser.image || user.image,
            },
          });
        } else {
          // User doesn't exist - create new user with OAuth data
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              image: user.image || null,
            },
          });

          // Create account record linking OAuth provider to new user
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
            },
          });
        }

        return true;
      } catch (error) {
        console.error(`${account?.provider} sign-in error:`, error);
        return false;
      }
    },
  },

  /**
   * Custom Pages Configuration
   *
   * Overrides default NextAuth UI pages with custom implementations.
   * @see https://next-auth.js.org/configuration/pages
   */
  pages: {
    signIn: "/signin", // Custom sign-in page at /signin
  },

  /**
   * Session Strategy Configuration
   *
   * JWT strategy: Sessions stored in encrypted JWT tokens (no database queries)
   * - Faster performance (no DB lookups)
   * - Stateless (works in serverless environments)
   * - Token stored in httpOnly cookie
   *
   * Alternative: "database" strategy stores sessions in PostgreSQL
   * @see https://next-auth.js.org/configuration/options#session
   */
  session: {
    strategy: "jwt",
  },

  /**
   * Secret Key for JWT Encryption
   *
   * Required for production. Used to encrypt JWT tokens and cookies.
   * Generate with: `openssl rand -base64 32`
   *
   * Environment variable: NEXTAUTH_SECRET
   * @see https://next-auth.js.org/configuration/options#secret
   */
  secret: env.NEXTAUTH_SECRET,
};

/**
 * NextAuth route handler instance.
 *
 * Handles all authentication requests at /api/auth/*
 * Routes include:
 * - /api/auth/signin - Sign in page
 * - /api/auth/signout - Sign out endpoint
 * - /api/auth/callback/* - OAuth callbacks
 * - /api/auth/session - Get current session
 * - /api/auth/csrf - CSRF token
 *
 * @see https://next-auth.js.org/getting-started/rest-api
 */
const handler: ReturnType<typeof NextAuth> = NextAuth(authOptions);

/**
 * Export handler for both GET and POST requests.
 * Next.js App Router requires named exports for HTTP methods.
 */
export { handler as GET, handler as POST };
