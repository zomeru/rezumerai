import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { UserAccountSettings } from "@rezumerai/types";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { ERROR_MESSAGES } from "@/constants/errors";

const changePasswordMock = mock(async () => ({ error: null }));
const mutateAccountSettingsMock = mock(async () => undefined);
const mutateSelectedModelMock = mock(async () => undefined);
const refetchAccountSettingsMock = mock(async () => undefined);
const refetchAiSettingsMock = mock(async () => undefined);
const useAccountSettingsMock = mock();
const useUpdateAccountSettingsMock = mock();
const useAiSettingsMock = mock();
const useUpdateSelectedAiModelMock = mock();
const toastErrorMock = mock(() => undefined);
const toastInfoMock = mock(() => undefined);
const toastSuccessMock = mock(() => undefined);

mock.module("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

mock.module("sonner", () => ({
  toast: {
    error: toastErrorMock,
    info: toastInfoMock,
    success: toastSuccessMock,
  },
}));

mock.module("@/components/ui/DisabledTooltip", () => ({
  DisabledTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

mock.module("@/components/ui/Select", () => ({
  Select: ({
    label,
    value,
    onChange,
    options,
    disabled,
    placeholder,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {!value && placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

mock.module("@/hooks/useAccount", () => ({
  useAccountSettings: useAccountSettingsMock,
  useUpdateAccountSettings: useUpdateAccountSettingsMock,
}));

mock.module("@/hooks/useAi", () => ({
  useAiSettings: useAiSettingsMock,
  useUpdateSelectedAiModel: useUpdateSelectedAiModelMock,
}));

mock.module("@/lib/auth-client", () => ({
  changePassword: changePasswordMock,
}));

const { default: WorkspaceSettingsPageClient } = await import("../WorkspaceSettingsPageClient");

function createAccountSettings(overrides?: Partial<UserAccountSettings>): UserAccountSettings {
  return {
    user: {
      id: "user_123",
      name: "Guest User",
      email: "guest@example.com",
      emailVerified: false,
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
    providers: [],
    permissions: {
      canEditName: true,
      canEditEmail: true,
      canEditImage: true,
      canChangePassword: false,
    },
    readOnlyReasons: {
      email: null,
      password: null,
    },
    passwordManagement: {
      hasCredentialProvider: false,
      isOAuthOnly: false,
      isCooldownActive: false,
      lastChangedAt: null,
      nextAllowedAt: null,
      cooldownMessage: null,
    },
    credits: {
      remaining: 10,
      dailyLimit: 25,
    },
    ...overrides,
  };
}

describe("WorkspaceSettingsPageClient", () => {
  beforeEach(() => {
    cleanup();

    changePasswordMock.mockReset();
    mutateAccountSettingsMock.mockReset();
    mutateSelectedModelMock.mockReset();
    refetchAccountSettingsMock.mockReset();
    refetchAiSettingsMock.mockReset();
    toastErrorMock.mockReset();
    toastInfoMock.mockReset();
    toastSuccessMock.mockReset();

    useAccountSettingsMock.mockReset();
    useAccountSettingsMock.mockReturnValue({
      data: createAccountSettings(),
      error: null,
      isLoading: false,
      refetch: refetchAccountSettingsMock,
    });

    useUpdateAccountSettingsMock.mockReset();
    useUpdateAccountSettingsMock.mockReturnValue({
      isPending: false,
      mutateAsync: mutateAccountSettingsMock,
    });

    useAiSettingsMock.mockReset();
    useAiSettingsMock.mockImplementation(({ enabled }: { enabled?: boolean } = {}) => ({
      data:
        enabled === false
          ? undefined
          : {
              models: [
                {
                  id: "openrouter/free",
                  modelId: "openrouter/free",
                  name: "OpenRouter Free",
                  providerName: "OPENROUTER",
                  providerDisplayName: "OpenRouter",
                },
              ],
              selectedModelId: "openrouter/free",
            },
      error: null,
      isLoading: false,
      refetch: refetchAiSettingsMock,
    }));

    useUpdateSelectedAiModelMock.mockReset();
    useUpdateSelectedAiModelMock.mockReturnValue({
      isPending: false,
      mutateAsync: mutateSelectedModelMock,
    });
  });

  it("shows anonymous-specific guidance for password and AI settings", () => {
    useAccountSettingsMock.mockReturnValue({
      data: createAccountSettings({
        user: {
          ...createAccountSettings().user,
          isAnonymous: true,
          emailVerified: false,
        },
      }),
      error: null,
      isLoading: false,
      refetch: refetchAccountSettingsMock,
    });

    const view = render(<WorkspaceSettingsPageClient />);

    expect(view.getByText("Please sign up to set and manage a password for this account.")).toBeTruthy();
    expect(view.getByText("Anonymous accounts do not have a password yet.")).toBeTruthy();
    expect(view.getByText(ERROR_MESSAGES.AI_AUTH_REQUIRED)).toBeTruthy();

    expect(view.queryByText("This account is connected to an OAuth provider.")).toBeNull();
    expect(
      view.queryByText("Password changes for OAuth-only accounts are managed by the connected provider."),
    ).toBeNull();
    expect(view.queryByText(ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED)).toBeNull();
  });
});
