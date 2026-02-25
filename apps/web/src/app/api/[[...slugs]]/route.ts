import { elysiaApp } from "@/elysia-api/app";

const compiledApp = elysiaApp.compile();

// Export Next.js route handlers
export const GET = compiledApp.handle;
export const POST = compiledApp.handle;
export const PUT = compiledApp.handle;
export const PATCH = compiledApp.handle;
export const DELETE = compiledApp.handle;
