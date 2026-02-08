"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers component that wraps the application.
 * - React Query for data fetching and caching
 * - Axe-core for development accessibility testing
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
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
