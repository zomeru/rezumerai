import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react";

const useSessionMock = mock();
const useAccountSettingsMock = mock();
const signOutMock = mock(async () => undefined);

mock.module("@/hooks/useAccount", () => ({
  useAccountSettings: useAccountSettingsMock,
}));

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
          name: "Test User",
          email: "test@example.com",
          image: null,
          role: "USER",
        },
        credits: {
          remaining: 7,
          dailyLimit: 100,
        },
      },
      isLoading: false,
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
