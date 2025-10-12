import { vi } from "vitest";

// Set test environment using vi.stubEnv
vi.stubEnv("NODE_ENV", "test");

// Mock database for tests
vi.mock("@rezumerai/database", () => ({
  // Add your database mocks here
  db: {},
}));
