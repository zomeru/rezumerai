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

// Set test environment using vi.stubEnv
vi.stubEnv("NODE_ENV", "test");
