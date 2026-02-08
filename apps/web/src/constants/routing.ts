// Authentication
const SIGNIN = "/signin";
const SIGNUP = "/signup";

// Workspace and resume builder
const WORKSPACE = "/workspace";
const PREVIEW = "/preview";
const BUILDER = `${WORKSPACE}/builder`;

export const ROUTES = {
  HOME: "/",
  SIGNIN,
  SIGNUP,
  WORKSPACE,
  PREVIEW,
  BUILDER,
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];
