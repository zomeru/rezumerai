import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        staleTime: 0, // Always refetch in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

interface TestProvidersProps {
  children: ReactNode;
}

function TestProviders({ children }: TestProvidersProps) {
  const queryClient = createTestQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Custom render function that includes providers
export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui, {
    wrapper: TestProviders,
  });
}

// Re-export everything else from @testing-library/react
export * from "@testing-library/react";
