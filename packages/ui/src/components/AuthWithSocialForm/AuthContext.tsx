"use client";

import { type ChangeEvent, type Context, createContext, type ReactNode, useContext, useReducer } from "react";

/**
 * Authentication form state managed by the auth reducer.
 *
 * @property email - User email input value
 * @property password - User password input value
 * @property confirmPassword - Confirm password input value (signup only)
 */
export interface AuthState {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Discriminated union of actions dispatched to the auth reducer.
 */
export type AuthAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "SET_CONFIRM_PASSWORD"; payload: string }
  | { type: "RESET" };

/**
 * Initial empty state for the authentication form.
 */
const initialState: AuthState = {
  email: "",
  password: "",
  confirmPassword: "",
};

/**
 * Pure reducer function for authentication form state transitions.
 *
 * @param state - Current authentication state
 * @param action - Action to apply
 * @returns Updated authentication state
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "SET_CONFIRM_PASSWORD":
      return { ...state, confirmPassword: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

/**
 * Context value shape for the authentication form.
 *
 * @property state - Current form state (email, password, confirmPassword)
 * @property setEmail - Handler for email input changes
 * @property setPassword - Handler for password input changes
 * @property setConfirmPassword - Handler for confirm password input changes
 * @property reset - Resets all form fields to initial empty state
 */
export interface AuthContextType {
  state: AuthState;
  setEmail: (e: ChangeEvent<HTMLInputElement>) => void;
  setPassword: (e: ChangeEvent<HTMLInputElement>) => void;
  setConfirmPassword: (e: ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

const AuthContext: Context<AuthContextType> = createContext<AuthContextType>({
  state: initialState,
  setEmail: () => {},
  setPassword: () => {},
  setConfirmPassword: () => {},
  reset: () => {},
});

/**
 * Props for the AuthProvider component.
 *
 * @property children - Child components that can access auth context
 */
export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Context provider for authentication form state management.
 * Wraps children with auth reducer state and dispatch actions.
 *
 * @param props - Provider props containing children
 * @returns Provider component wrapping children with auth context
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialState);

  function setEmail(e: ChangeEvent<HTMLInputElement>): void {
    dispatch({ type: "SET_EMAIL", payload: e.target.value });
  }

  function setPassword(e: ChangeEvent<HTMLInputElement>): void {
    dispatch({ type: "SET_PASSWORD", payload: e.target.value });
  }

  function setConfirmPassword(e: ChangeEvent<HTMLInputElement>): void {
    dispatch({ type: "SET_CONFIRM_PASSWORD", payload: e.target.value });
  }

  function reset(): void {
    dispatch({ type: "RESET" });
  }

  return (
    <AuthContext.Provider value={{ state, setEmail, setPassword, setConfirmPassword, reset }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access the authentication form context.
 * Must be used within an AuthProvider.
 *
 * @returns Auth context with form state and dispatch functions
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * const { state, setEmail, setPassword, reset } = useAuthSocialForm();
 * ```
 */
export function useAuthSocialForm(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthSocialForm must be used within an AuthProvider");
  }

  return ctx;
}
