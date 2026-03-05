import { afterEach, expect, mock } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock Next.js router
mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: mock(),
    replace: mock(),
    prefetch: mock(),
    back: mock(),
    forward: mock(),
    refresh: mock(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock client-side hooks to return fixed values for testing
mock.module("../hooks/useClientDate", () => ({
  useClientDate: mock(() => new Date("2025-10-13T00:00:00.000Z")),
  useIsMounted: mock(() => true),
}));

// Mock the API module to prevent actual HTTP calls
mock.module("@/lib/api", () => ({
  api: {
    getHealth: {
      useQuery: mock(() => ({
        data: {
          status: 200,
          body: {
            success: true,
            data: {
              message: "Hello from express!",
              timestamp: "10/13/2025",
              server: "Rezumer API",
            },
          },
        },
        isLoading: false,
        error: null,
      })),
    },
    getUsers: {
      useQuery: mock(() => ({
        data: {
          status: 200,
          body: {
            success: true,
            data: [
              { id: "1", name: "John Doe", email: "john@example.com" },
              { id: "2", name: "Jane Smith", email: "jane@example.com" },
            ],
          },
        },
        isLoading: false,
        error: null,
        refetch: mock(),
      })),
    },
    getUser: {
      useQuery: mock(() => ({
        data: {
          status: 200,
          body: {
            success: true,
            data: { id: "1", name: "John Doe", email: "john@example.com" },
          },
        },
        isLoading: false,
        error: null,
        refetch: mock(),
      })),
    },
    getProjects: {
      useQuery: mock(() => ({
        data: {
          status: 200,
          body: {
            success: true,
            data: [
              {
                id: "1",
                title: "Resume Builder",
                description: "Build amazing resumes",
                userId: "1",
              },
              {
                id: "2",
                title: "Portfolio Site",
                description: "Personal portfolio website",
                userId: "2",
              },
            ],
          },
        },
        isLoading: false,
        error: null,
      })),
    },
    createUser: {
      useMutation: mock(() => ({
        mutate: mock(),
        isPending: false,
        isError: false,
        error: null,
      })),
    },
  },
}));
