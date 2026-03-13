import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import {
  refetchAccountSettingsMock,
  resetAccountHooksModuleMock,
  useAccountSettingsMock,
} from "@/test-utils/account-hooks-module-mock";

const writableEnv = process.env as Record<string, string | undefined>;
const useSessionMock = mock();
writableEnv.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
writableEnv.NODE_ENV ??= "test";
const authClientModule = await import("@/lib/auth-client");

let navbarImportVersion = 0;

async function renderNavbar() {
  navbarImportVersion += 1;
  const { default: Navbar } = await import(
    new URL(`../Navbar.tsx?test=navbar-${navbarImportVersion}`, import.meta.url).href
  );

  return render(<Navbar />);
}

describe("Navbar", () => {
  beforeEach(() => {
    mock.restore();
    resetAccountHooksModuleMock();

    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          role: "USER",
          isAnonymous: false,
        },
      },
    });
    spyOn(authClientModule, "useSession").mockImplementation(() => useSessionMock());

    useAccountSettingsMock.mockReset();
    useAccountSettingsMock.mockReturnValue({
      data: {
        user: {
          id: "user_123",
          name: "Test User",
          email: "test@example.com",
          emailVerified: true,
          isAnonymous: false,
          image: null,
          lastPasswordChangeAt: null,
          role: "USER",
          banned: false,
          banReason: null,
          banExpires: null,
          selectedAiModel: "openrouter/free",
          createdAt: new Date("2026-03-10T00:00:00.000Z"),
          updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        },
        credits: {
          remaining: 7,
          dailyLimit: 100,
        },
        providers: [],
        permissions: {
          canEditName: true,
          canEditEmail: true,
          canEditImage: true,
          canChangePassword: true,
        },
        readOnlyReasons: {
          email: null,
          password: null,
        },
        passwordManagement: {
          hasCredentialProvider: true,
          isOAuthOnly: false,
          isCooldownActive: false,
          lastChangedAt: null,
          nextAllowedAt: null,
          cooldownMessage: null,
        },
      },
      isLoading: false,
      error: null,
      refetch: refetchAccountSettingsMock,
    });
  });

  afterEach(() => {
    cleanup();
    mock.restore();
  });

  it("shows a text optimizer link in the authenticated profile dropdown", async () => {
    const view = await renderNavbar();

    fireEvent.click(view.getAllByRole("button")[0] as HTMLButtonElement);

    expect(view.getByRole("link", { name: "Text Optimizer" })).toHaveAttribute("href", "/text-optimizer");
  });

  it("defers account settings loading until the dropdown is opened", async () => {
    const view = await renderNavbar();

    expect(useAccountSettingsMock).toHaveBeenLastCalledWith({
      enabled: false,
    });

    fireEvent.click(view.getAllByRole("button")[0] as HTMLButtonElement);

    expect(useAccountSettingsMock).toHaveBeenLastCalledWith({
      enabled: true,
    });
  });
});
