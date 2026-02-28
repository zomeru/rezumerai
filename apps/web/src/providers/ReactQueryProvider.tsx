"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { getQueryClient } from "@/lib/get-query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
