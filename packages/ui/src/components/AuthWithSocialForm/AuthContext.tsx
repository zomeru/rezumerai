"use client";

import {
  type ChangeEvent,
  createContext,
  type ReactNode,
  useContext,
  useReducer,
} from "react";

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

const AuthContext = createContext<{
  state: AuthState;
  setEmail: (e: ChangeEvent<HTMLInputElement>) => void;
  setPassword: (e: ChangeEvent<HTMLInputElement>) => void;
  setConfirmPassword: (e: ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}>({
  state: initialState,
  setEmail: () => {},
  setPassword: () => {},
  setConfirmPassword: () => {},
  reset: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setEmail = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: "SET_EMAIL", payload: e.target.value });
  const setPassword = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: "SET_PASSWORD", payload: e.target.value });
  const setConfirmPassword = (e: ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: "SET_CONFIRM_PASSWORD", payload: e.target.value });
  const reset = () => dispatch({ type: "RESET" });

  return (
    <AuthContext.Provider
      value={{ state, setEmail, setPassword, setConfirmPassword, reset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSocialForm() {
  return useContext(AuthContext);
}
