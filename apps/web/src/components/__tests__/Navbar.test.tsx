import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import {
  refetchAccountSettingsMock,
  resetAccountHooksModuleMock,
  useAccountSettingsMock,
} from "@/test-utils/account-hooks-module-mock";

const useSessionMock = mock();
const signOutMock = mock(async () => undefined);

mock.module("@/lib/auth-client", () => ({
  getSessionUserRole: (session: { user?: { role?: string | null } } | null | undefined) =>
    session?.user?.role === "ADMIN" || session?.user?.role === "USER" ? session.user.role : null,
  isAnonymousSession: (session: { user?: { isAnonymous?: boolean | null } } | null | undefined) =>
    session?.user?.isAnonymous === true,
  signOut: signOutMock,
  useSession: useSessionMock,
}));

const { default: Navbar } = await import("../Navbar");

describe("Navbar", () => {
  beforeEach(() => {
    resetAccountHooksModuleMock();
    signOutMock.mockReset();

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

  it("shows a text optimizer link in the authenticated profile dropdown", () => {
    const view = render(<Navbar />);

    fireEvent.click(view.getAllByRole("button")[0] as HTMLButtonElement);

    expect(view.getByRole("link", { name: "Text Optimizer" })).toHaveAttribute("href", "/text-optimizer");
  });

  it("defers account settings loading until the dropdown is opened", () => {
    const view = render(<Navbar />);

    expect(useAccountSettingsMock).toHaveBeenLastCalledWith({
      enabled: false,
    });

    fireEvent.click(view.getAllByRole("button")[0] as HTMLButtonElement);

    expect(useAccountSettingsMock).toHaveBeenLastCalledWith({
      enabled: true,
    });
  });
});
