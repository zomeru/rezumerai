"use client";

import { Github } from "lucide-react";
import type React from "react";
import { memo, useId, useState } from "react";
import { AuthProvider, type AuthState, useAuthSocialForm } from "./AuthContext";

/**
 * Base authentication form props.
 *
 * @property onSubmit - Form submission handler receiving auth state and form event
 * @property onSuccess - Optional callback invoked on successful submission
 * @property onFinally - Optional cleanup callback invoked after submission
 * @property appName - Optional application name (defaults to "Rezumer")
 * @property handleGoogleAuth - Optional Google OAuth handler
 * @property handleGithubAuth - Optional GitHub OAuth handler
 * @property handleAppleAuth - Optional Apple OAuth handler
 *
 * @example
 * ```tsx
 * // With social auth
 * <AuthWithSocialForm
 *   type="signin"
 *   onSubmit={handleSubmit}
 *   handleGoogleAuth={handleGoogle}
 *   handleGithubAuth={handleGitHub}
 * />
 *
 * // Without social auth
 * <AuthWithSocialForm
 *   type="signup"
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
interface BaseAuthFormProps {
  onSubmit: (state: AuthState, e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  onSuccess?: () => void;
  onFinally?: () => void;
  appName?: string;
  handleGoogleAuth?: () => void;
  handleGithubAuth?: () => void;
  handleAppleAuth?: () => void;
}

/**
 * Discriminated union props for AuthWithSocialForm component.
 * Determines form behavior based on authentication type.
 *
 * @property type - Form mode: "signin" or "signup"
 * @property resetPasswordLink - (signin only) Optional password reset URL
 *
 * @example
 * ```tsx
 * // Sign in form with password reset
 * const signinProps: AuthWithSocialFormProps = {
 *   type: "signin",
 *   resetPasswordLink: "/reset-password",
 *   handleGoogleAuth: handleGoogle,
 *   NextImage: Image,
 *   onSubmit: handleSignIn
 * };
 *
 * // Sign up form
 * const signupProps: AuthWithSocialFormProps = {
 *   type: "signup",
 *   onSubmit: handleSignUp
 * };
 * ```
 */
type AuthWithSocialFormProps =
  | (BaseAuthFormProps & {
      type: "signin";
      resetPasswordLink?: string;
    })
  | (BaseAuthFormProps & {
      type: "signup";
    });

/**
 * Internal password input field component with confirm mode support.
 * Connects to AuthContext for state management.
 *
 * @param props - Component configuration
 * @param props.isConfirm - Whether this is the confirm password field (signup only)
 * @returns Styled password input with placeholder and validation
 *
 * @internal
 */
function PasswordInput({ isConfirm = false }: { isConfirm?: boolean }) {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const { state, setPassword, setConfirmPassword } = useAuthSocialForm();

  const handleChange = isConfirm ? setConfirmPassword : setPassword;

  return (
    <input
      id={isConfirm ? confirmPasswordId : passwordId}
      className="mt-1 w-full rounded-full border border-gray-500/30 bg-transparent px-4 py-2.5 outline-none"
      type="password"
      placeholder={isConfirm ? "Confirm your password" : "Enter your password"}
      required
      value={isConfirm ? state.confirmPassword : state.password}
      onChange={handleChange}
      autoComplete="new-password"
    />
  );
}

/**
 * Core authentication form component supporting email/password and social OAuth.
 * Handles both signin and signup flows with optional Google/GitHub/Apple authentication.
 *
 * Features:
 * - Email/password authentication with validation
 * - Confirm password field for signup
 * - Optional Google/GitHub/Apple OAuth buttons with lucide icons
 * - Password reset link (signin mode)
 * - Account toggle link (signin ↔ signup)
 * - Form state management via AuthContext
 * - Error handling and lifecycle callbacks
 *
 * @param props - Form configuration props
 * @returns Styled authentication form with social auth options
 *
 * @internal Use AuthWithSocialFormWrapper (default export) instead
 *
 * @example
 * ```tsx
 * <AuthWithSocialForm
 *   type="signin"
 *   resetPasswordLink="/reset"
 *   handleGoogleAuth={signInWithGoogle}
 *   handleGithubAuth={signInWithGitHub}
 *   handleAppleAuth={signInWithApple}
 *   onSubmit={handleSubmit}
 *   onSuccess={() => router.push('/dashboard')}
 * />
 * ```
 */
const AuthWithSocialForm: React.MemoExoticComponent<React.FC<AuthWithSocialFormProps>> = memo(
  ({
    onSubmit,
    onSuccess,
    onFinally,
    appName = "Rezumer",
    handleGoogleAuth,
    handleGithubAuth,
    handleAppleAuth,
    ...props
  }: AuthWithSocialFormProps) => {
    const type = props.type;
    const isSignIn = type === "signin";
    const resetPasswordLink = type === "signin" ? props.resetPasswordLink : undefined;
    const emailId = useId();

    const [authError, setAuthError] = useState<string | null>(null);

    const { state, setEmail, reset } = useAuthSocialForm();

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>): Promise<void> {
      e.preventDefault();
      try {
        await onSubmit(state, e);
        reset();
        onSuccess?.();
      } catch (error) {
        console.error("[AuthWithSocialForm] Error during form submission:", error);
        if (error instanceof Error) {
          setAuthError(error.message);
        } else {
          setAuthError("Unknown error occurred");
        }
      } finally {
        onFinally?.();
      }
    }

    return (
      <div className="mx-4 max-w-96 rounded-xl bg-white p-4 text-left text-gray-500 text-sm shadow-[0px_0px_10px_0px] shadow-black/10 md:p-6">
        <h2 className="mb-6 text-center font-semibold text-2xl text-gray-800">
          {isSignIn ? "Log in to your account" : "Create your account"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            id={emailId}
            className="my-4 w-full rounded-full border border-gray-500/30 bg-transparent px-4 py-2.5 outline-none"
            type="email"
            placeholder="Enter your email"
            value={state.email}
            onChange={setEmail}
            required
            autoComplete="email"
          />
          <PasswordInput />
          {!isSignIn && (
            <div className="my-4">
              <PasswordInput isConfirm />
            </div>
          )}
          {authError && (
            <div
              className={`rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-red-700 ${isSignIn ? "mt-4" : "my-4"}`}
            >
              {authError}
            </div>
          )}
          {isSignIn && (
            <div className="py-4 text-right">
              <a className="cursor-pointer text-primary-500 underline" href={resetPasswordLink}>
                Forgot Password
              </a>
            </div>
          )}
          <button
            type="submit"
            className="mb-3 w-full rounded-lg bg-primary-500 py-2.5 text-white hover:bg-primary-700"
          >
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center">
          {isSignIn ? `New to ${appName}?` : "Already have an account?"}{" "}
          <a href={isSignIn ? "/signup" : "/signin"} className="text-primary-500 underline">
            {isSignIn ? "Create an account" : "Sign In"}
          </a>
        </p>
        {handleGoogleAuth && (
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-500/30 bg-white py-2.5 text-gray-800 hover:bg-gray-50"
          >
            <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <title>Google logo</title>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        )}
        {handleGithubAuth && (
          <button
            type="button"
            onClick={handleGithubAuth}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-500/30 bg-white py-2.5 text-gray-800 hover:bg-gray-50"
          >
            <Github className="size-5" />
            Continue with GitHub
          </button>
        )}
        {handleAppleAuth && (
          <button
            type="button"
            onClick={handleAppleAuth}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-black py-2.5 text-white hover:bg-gray-900"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <title>Apple logo</title>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>
        )}
      </div>
    );
  },
);

/**
 * Authentication form with AuthProvider wrapper for context state management.
 * Supports email/password auth with optional Google/GitHub/Apple OAuth.
 *
 * @param props - Form configuration props
 * @returns Authentication form wrapped with AuthProvider context
 *
 * @example
 * ```tsx
 * import AuthWithSocialForm from '@rezumerai/ui/components/AuthWithSocialForm';
 *
 * <AuthWithSocialForm
 *   type="signup"
 *   handleGoogleAuth={() => signIn('google')}
 *   handleGithubAuth={() => signIn('github')}
 *   handleAppleAuth={() => signIn('apple')}
 *   onSubmit={async (state) => {
 *     await createUser(state.email, state.password);
 *   }}
 *   onSuccess={() => router.push('/welcome')}
 * />
 * ```
 */
export default function AuthWithSocialFormWrapper(props: AuthWithSocialFormProps) {
  return (
    <AuthProvider>
      <AuthWithSocialForm {...props} />
    </AuthProvider>
  );
}
