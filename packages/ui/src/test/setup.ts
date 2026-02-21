import { afterEach, expect, mock } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Setup for UI component testing
global.ResizeObserver = mock().mockImplementation(() => ({
  observe: mock(),
  unobserve: mock(),
  disconnect: mock(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mock().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: mock(),
    removeListener: mock(),
    addEventListener: mock(),
    removeEventListener: mock(),
    dispatchEvent: mock(),
  })),
});
