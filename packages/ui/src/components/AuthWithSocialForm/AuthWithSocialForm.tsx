"use client";

import type React from "react";
import { useId } from "react";
import type { NextImageProps } from "../types/image";
import { AuthProvider, type AuthState, useAuthSocialForm } from "./AuthContext";

/**
 * Base authentication form props with conditional social auth configuration.
 * Enforces NextImage requirement when social auth is enabled.
 *
 * - If Google or Apple auth is provided → NextImage is REQUIRED
 * - If no social auth → NextImage is OPTIONAL
 *
 * @example
 * ```tsx
 * // With social auth (NextImage required)
 * const propsWithSocial: BaseAuthFormProps = {
 *   googleAuth: handleGoogle,
 *   NextImage: Image,
 *   onSubmit: handleSubmit
 * };
 *
 * // Without social auth (NextImage optional)
 * const propsNoSocial: BaseAuthFormProps = {
 *   onSubmit: handleSubmit
 * };
 * ```
 */
type BaseAuthFormProps =
  // Social auth exists → NextImage REQUIRED
  | ({
      googleAuth: () => void;
      appleAuth?: () => void;
    } & RequiredImageProps)
  | ({
      googleAuth?: () => void;
      appleAuth: () => void;
    } & RequiredImageProps)
  // No social auth → NextImage OPTIONAL
  | ({
      googleAuth?: undefined;
      appleAuth?: undefined;
    } & OptionalImageProps);

/**
 * Props requiring NextImage component (used when social auth is enabled).
 *
 * @property NextImage - Required Next.js Image component for social auth icons
 * @property onSubmit - Form submission handler receiving auth state and form event
 * @property onSuccess - Optional callback invoked on successful submission
 * @property onError - Optional error handler receiving Error object
 * @property onFinally - Optional cleanup callback invoked after submission
 * @property appName - Optional application name (defaults to "Rezumer")
 */
interface RequiredImageProps {
  NextImage: React.ComponentType<NextImageProps>;
  onSubmit: (state: AuthState, e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  appName?: string;
}

/**
 * Props with optional NextImage component (used when social auth is disabled).
 *
 * @property NextImage - Optional Next.js Image component (not needed without social auth)
 * @property onSubmit - Form submission handler receiving auth state and form event
 * @property onSuccess - Optional callback invoked on successful submission
 * @property onError - Optional error handler receiving Error object
 * @property onFinally - Optional cleanup callback invoked after submission
 * @property appName - Optional application name (defaults to "Rezumer")
 */
interface OptionalImageProps {
  NextImage?: React.ComponentType<NextImageProps>;
  onSubmit: (state: AuthState, e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  appName?: string;
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
 *   googleAuth: handleGoogle,
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
function PasswordInput({ isConfirm = false }: { isConfirm?: boolean }): React.JSX.Element {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const { state, setPassword, setConfirmPassword } = useAuthSocialForm();

  const handleChange = isConfirm ? setConfirmPassword : setPassword;
  const value = isConfirm ? state.confirmPassword : state.password;

  return (
    <input
      id={isConfirm ? confirmPasswordId : passwordId}
      className="mt-1 w-full rounded-full border border-gray-500/30 bg-transparent px-4 py-2.5 outline-none"
      type="password"
      placeholder={isConfirm ? "Confirm your password" : "Enter your password"}
      required
      value={value}
      onChange={handleChange}
      autoComplete="new-password"
    />
  );
}

/**
 * Core authentication form component supporting email/password and social OAuth.
 * Handles both signin and signup flows with optional Google/Apple authentication.
 *
 * Features:
 * - Email/password authentication with validation
 * - Confirm password field for signup
 * - Optional Google/Apple OAuth buttons with icons
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
 *   googleAuth={signInWithGoogle}
 *   NextImage={Image}
 *   onSubmit={handleSubmit}
 *   onSuccess={() => router.push('/dashboard')}
 *   onError={(err) => toast.error(err.message)}
 * />
 * ```
 */
function AuthWithSocialForm(props: AuthWithSocialFormProps): React.JSX.Element {
  const {
    type,
    onSubmit,
    appName = "Rezumer",
    googleAuth,
    appleAuth,
    onSuccess,
    onError,
    onFinally,
    NextImage,
  } = props;
  const resetPasswordLink = type === "signin" ? props.resetPasswordLink : undefined;

  const isSignIn = type === "signin";
  const emailId = useId();

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
        onError?.(error);
      } else {
        onError?.(new Error("Unknown error occurred"));
      }
    } finally {
      onFinally?.();
    }
  }

  function handleGoogleAuth(): void {
    googleAuth?.();
  }

  function handleAppleAuth(): void {
    appleAuth?.();
  }

  return (
    <div className="mx-4 max-w-96 rounded-xl bg-white p-4 text-left text-gray-500 text-sm shadow-[0px_0px_10px_0px] shadow-black/10 md:p-6">
      <h2 className="mb-6 text-center font-semibold text-2xl text-gray-800">
        {isSignIn ? "Log in to your account" : "Create your account"}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          id={emailId}
          className="my-3 w-full rounded-full border border-gray-500/30 bg-transparent px-4 py-2.5 outline-none"
          type="email"
          placeholder="Enter your email"
          value={state.email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <PasswordInput />
        {!isSignIn && (
          <div className="my-3">
            <PasswordInput isConfirm />
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
          className="mb-3 w-full rounded-full bg-primary-500 py-2.5 text-white hover:bg-primary-700"
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
      {googleAuth && (
        <button
          type="button"
          onClick={handleAppleAuth}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black py-2.5 text-white"
        >
          <NextImage
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/appleLogo.png"
            alt="appleLogo"
            width={20}
            height={20}
          />
          Continue with Apple
        </button>
      )}
      {appleAuth && (
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="my-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-500/30 bg-white py-2.5 text-gray-800"
        >
          <NextImage
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleFavicon.png"
            alt="googleFavicon"
            width={20}
            height={20}
          />
          Continue with Google
        </button>
      )}
    </div>
  );
}

/**
 * Authentication form with AuthProvider wrapper for context state management.
 * Supports email/password auth with optional Google/Apple OAuth.
 *
 * @param props - Form configuration props
 * @returns Authentication form wrapped with AuthProvider context
 *
 * @example
 * ```tsx
 * import AuthWithSocialForm from '@rezumerai/ui/components/AuthWithSocialForm';
 * import Image from 'next/image';
 *
 * <AuthWithSocialForm
 *   type="signup"
 *   googleAuth={() => signIn('google')}
 *   appleAuth={() => signIn('apple')}
 *   NextImage={Image}
 *   onSubmit={async (state) => {
 *     await createUser(state.email, state.password);
 *   }}
 *   onSuccess={() => router.push('/welcome')}
 * />
 * ```
 */
export default function AuthWithSocialFormWrapper(props: AuthWithSocialFormProps): React.JSX.Element {
  return (
    <AuthProvider>
      <AuthWithSocialForm {...props} />
    </AuthProvider>
  );
}
