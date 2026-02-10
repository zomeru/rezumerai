"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { isRetryableError, logError } from "@/lib/errors";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers component that wraps the application.
 * - React Query for data fetching and caching with enterprise retry logic
 * - Axe-core for development accessibility testing
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
            onError: (error: Error): void => {
              logError(error, "error", {
                component: "ReactQuery",
                action: "mutation_failed",
              });
            },
          },
        },
      }),
  );

  // Enable axe-core accessibility testing in development
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      import("@axe-core/react").then((axe) => {
        axe.default(React, ReactDOM, 1000, {
          rules: [
            {
              id: "color-contrast",
              enabled: true,
            },
            {
              id: "label",
              enabled: true,
            },
            {
              id: "button-name",
              enabled: true,
            },
          ],
        });
      });
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
