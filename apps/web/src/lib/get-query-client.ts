import { defaultShouldDehydrateQuery, isServer, QueryClient } from "@tanstack/react-query";
import { isRetryableError, logError } from "./errors";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 1 minute before considering it stale
        staleTime: 60 * 1000,

        // Keep unused data in cache for 5 minutes
        gcTime: 5 * 60 * 1000,

        /**
         * Enterprise retry strategy with exponential backoff.
         * - Retries up to 3 times for retryable errors (network, 5xx)
         * - Uses exponential backoff: 1s, 2s, 4s
         * - Does not retry for client errors (4xx)
         */
        retry: (failureCount: number, error: unknown): boolean => {
          // Max 3 retry attempts
          if (failureCount >= 3) return false;

          // Only retry if error is retryable (network, 5xx, timeout)
          return isRetryableError(error);
        },

        /**
         * Exponential backoff delay calculation.
         * Attempt 1: 1000ms, Attempt 2: 2000ms, Attempt 3: 4000ms
         */
        retryDelay: (attemptIndex: number): number => {
          return Math.min(1000 * 2 ** attemptIndex, 10000);
        },

        // Refetch on window focus only if data is stale
        refetchOnWindowFocus: false,

        // Refetch on reconnect for better offline support
        refetchOnReconnect: "always",
      },

      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },

      mutations: {
        /**
         * Mutations (POST, PUT, DELETE) are retried less aggressively.
         * Only retry network failures, not validation/auth errors.
         */
        retry: (failureCount: number, error: unknown): boolean => {
          if (failureCount >= 2) return false;

          // Only retry on network failures, not on business logic errors
          const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
          return errorMessage.includes("network") || errorMessage.includes("fetch failed");
        },

        retryDelay: (attemptIndex: number): number => {
          return Math.min(1000 * 2 ** attemptIndex, 5000);
        },

        /**
         * Global error handler for mutations.
         * Logs all mutation errors for monitoring.
         */
        onError: (error: Error) => {
          logError(error, "error", {
            component: "ReactQuery",
            action: "mutation_failed",
          });
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}
