"use client";

import { type ChangeEvent, type Context, createContext, type ReactNode, useContext, useReducer } from "react";

export interface AuthState {
  email: string;
  password: string;
  confirmPassword: string;
}

type AuthAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "SET_CONFIRM_PASSWORD"; payload: string }
  | { type: "RESET" };

const initialState: AuthState = {
  email: "",
  password: "",
  confirmPassword: "",
};

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

interface AuthContextType {
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

interface AuthProviderProps {
  children: ReactNode;
}

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

export function useAuthSocialForm(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthSocialForm must be used within an AuthProvider");
  }

  return ctx;
}
