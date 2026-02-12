// Authentication
const SIGNIN = "/signin";
const SIGNUP = "/signup";

// Workspace and resume builder
const WORKSPACE = "/workspace";
const PREVIEW = "/preview";
const BUILDER = `${WORKSPACE}/builder`;

/**
 * Centralized route constants for application navigation.
 * Always import and use these constants instead of hardcoding route strings.
 *
 * @property HOME - Homepage route (/)
 * @property SIGNIN - Sign in page route
 * @property SIGNUP - Sign up page route
 * @property WORKSPACE - Dashboard workspace route
 * @property PREVIEW - Resume preview route (dynamic: /preview/[resumeId])
 * @property BUILDER - Resume builder route (dynamic: /workspace/builder/[resumeId])
 *
 * @example
 * ```tsx
 * import { ROUTES } from '@/constants/routing';
 *
 * <Link href={ROUTES.WORKSPACE}>Dashboard</Link>
 * router.push(ROUTES.SIGNIN);
 * ```
 */
export const ROUTES = {
  HOME: "/",
  SIGNIN,
  SIGNUP,
  WORKSPACE,
  PREVIEW,
  BUILDER,
} as const;

/**
 * Union type of all route constant keys.
 * Useful for type-safe route key validation.
 */
export type RouteKey = keyof typeof ROUTES;

/**
 * Union type of all possible route path values.
 * Represents valid route strings from ROUTES constant.
 */
export type RouteValue = (typeof ROUTES)[RouteKey];
