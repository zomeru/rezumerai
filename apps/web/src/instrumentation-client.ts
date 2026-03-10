import { initBotId } from "botid/client/core";

const isBotIdEnabled = process.env.NEXT_PUBLIC_BOTID_ENABLED === "true";

// Define the paths that need bot protection.
// These are paths that are routed to by your app.
// These can be:
// - API endpoints (e.g., '/api/checkout')
// - Server actions invoked from a page (e.g., '/dashboard')
// - Dynamic routes (e.g., '/api/create/*')

if (isBotIdEnabled) {
  initBotId({
    protect: [
      {
        path: "/api/*",
        method: "POST",
      },
      {
        path: "/api/*",
        method: "PUT",
      },
      {
        path: "/api/*",
        method: "PATCH",
      },
      {
        path: "/api/*",
        method: "DELETE",
      },
    ],
  });
}
