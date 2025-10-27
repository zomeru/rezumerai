"use client";

import { useId } from "react";
import { AuthProvider, type AuthState, useAuthSocialForm } from "./AuthContext";

interface BaseAuthFormProps {
  onSubmit: (state: AuthState, e: React.FormEvent) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  appName?: string;
  googleAuth?: () => void;
  appleAuth?: () => void;
}

type AuthWithSocialFormProps =
  | (BaseAuthFormProps & {
      type: "signin";
      resetPasswordLink?: string;
    })
  | (BaseAuthFormProps & {
      type: "signup";
    });

function PasswordInput({ isConfirm = false }: { isConfirm?: boolean }) {
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

function AuthWithSocialForm(props: AuthWithSocialFormProps) {
  const { type, onSubmit, appName = "Rezumer", googleAuth, appleAuth, onSuccess, onError, onFinally } = props;
  const resetPasswordLink = type === "signin" ? props.resetPasswordLink : undefined;

  const isSignIn = type === "signin";
  const emailId = useId();

  const { state, setEmail, reset } = useAuthSocialForm();

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleGoogleAuth = () => {
    googleAuth?.();
  };

  const handleAppleAuth = () => {
    appleAuth?.();
  };

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
          <img
            className="h-4 w-4"
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/appleLogo.png"
            alt="appleLogo"
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
          <img
            className="h-4 w-4"
            src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleFavicon.png"
            alt="googleFavicon"
          />
          Continue with Google
        </button>
      )}
    </div>
  );
}

export default function AuthWithSocialFormWrapper(props: AuthWithSocialFormProps) {
  return (
    <AuthProvider>
      <AuthWithSocialForm {...props} />
    </AuthProvider>
  );
}
