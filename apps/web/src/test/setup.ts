import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// Make React available globally for JSX
globalThis.React = React;

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock client-side hooks to return fixed values for testing
vi.mock("../hooks/use-client-date", () => ({
  useClientDate: vi.fn(() => new Date("2025-10-13T00:00:00.000Z")),
  useIsMounted: vi.fn(() => true),
}));

// Mock the API module to prevent actual HTTP calls
vi.mock("../lib/api", () => ({
  api: {
    getHealth: {
      useQuery: vi.fn(() => ({
        data: {
          status: 200,
          body: {
            success: true,
            data: {
              message: "Hello from express!",
              timestamp: "10/13/2025",
              server: "RezumerAI API",
            },
          },
        },
        isLoading: false,
        error: null,
      })),
    },
    getUsers: {
      useQuery: vi.fn(() => ({
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
        refetch: vi.fn(),
      })),
    },
    getUser: {
      useQuery: vi.fn(() => ({
        data: {
          status: 200,
          body: {
            success: true,
            data: { id: "1", name: "John Doe", email: "john@example.com" },
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })),
    },
    getProjects: {
      useQuery: vi.fn(() => ({
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
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      })),
    },
  },
}));

// Set test environment using vi.stubEnv
vi.stubEnv("NODE_ENV", "test");
