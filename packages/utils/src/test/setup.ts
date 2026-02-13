import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Set test environment using vi.stubEnv
vi.stubEnv("NODE_ENV", "test");
