import { mock } from "bun:test";
import type { UpdateUserAccountInput, UserAccountSettings } from "@rezumerai/types";

export const refetchAccountSettingsMock = mock(async () => undefined);
export const updateAccountSettingsMutateAsyncMock = mock(
  async (_updates: UpdateUserAccountInput): Promise<UserAccountSettings> => {
    throw new Error("updateAccountSettingsMutateAsyncMock not configured for this test.");
  },
);

export const useAccountSettingsMock = mock(
  (_options?: {
    enabled?: boolean;
  }): {
    data: UserAccountSettings | undefined;
    error?: Error | null;
    isLoading: boolean;
    refetch: typeof refetchAccountSettingsMock;
  } => ({
    data: undefined,
    error: null,
    isLoading: false,
    refetch: refetchAccountSettingsMock,
  }),
);

export const useUpdateAccountSettingsMock = mock(
  (): {
    isPending: boolean;
    mutateAsync: typeof updateAccountSettingsMutateAsyncMock;
  } => ({
    isPending: false,
    mutateAsync: updateAccountSettingsMutateAsyncMock,
  }),
);

export function resetAccountHooksModuleMock(): void {
  refetchAccountSettingsMock.mockReset();
  refetchAccountSettingsMock.mockImplementation(async () => undefined);

  updateAccountSettingsMutateAsyncMock.mockReset();
  updateAccountSettingsMutateAsyncMock.mockImplementation(async () => {
    throw new Error("updateAccountSettingsMutateAsyncMock not configured for this test.");
  });

  useAccountSettingsMock.mockReset();
  useAccountSettingsMock.mockImplementation(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    refetch: refetchAccountSettingsMock,
  }));

  useUpdateAccountSettingsMock.mockReset();
  useUpdateAccountSettingsMock.mockImplementation(() => ({
    isPending: false,
    mutateAsync: updateAccountSettingsMutateAsyncMock,
  }));
}

resetAccountHooksModuleMock();

mock.module("@/hooks/useAccount", () => ({
  useAccountSettings: useAccountSettingsMock,
  useUpdateAccountSettings: useUpdateAccountSettingsMock,
}));
