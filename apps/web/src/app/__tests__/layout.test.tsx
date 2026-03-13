import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { isValidElement } from "react";

const connectionMock = mock(async () => undefined);

describe("RootLayout", () => {
  beforeEach(() => {
    mock.module("next/server", () => ({
      connection: connectionMock,
    }));

    mock.module("next/font/google", () => ({
      Outfit: () => ({
        variable: "--font-outfit",
      }),
    }));

    mock.module("sonner", () => ({
      toast: {
        error: mock(() => undefined),
        info: mock(() => undefined),
        success: mock(() => undefined),
      },
      Toaster: () => <div data-testid="toaster" />,
    }));

    mock.module("@/providers", () => ({
      ReactQueryProvider: ({ children }: { children: ReactNode }) => (
        <div data-testid="react-query-provider">{children}</div>
      ),
    }));

    mock.module("@/env", () => ({
      clientEnv: {
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      },
    }));
  });

  afterEach(() => {
    cleanup();
    connectionMock.mockClear();
    mock.restore();
  });

  it("waits for an incoming request so nonce-based CSP can be applied", async () => {
    const layoutModule = await import("../layout");
    const RootLayout = layoutModule.default;

    const tree = await RootLayout({
      children: <div>Page content</div>,
    });

    expect(connectionMock).toHaveBeenCalledTimes(1);
    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe("html");
  });
});
