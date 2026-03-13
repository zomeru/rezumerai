import { mock } from "bun:test";
import type {
  AnalyticsDashboard,
  FeatureFlagEntry,
  FeatureFlagListResponse,
  SaveFeatureFlagInput,
  SystemConfigurationEntry,
  SystemConfigurationListResponse,
  UpdateSystemConfigurationInput,
} from "@rezumerai/types";

export const adminRefetchMock = mock(async () => undefined);
export const saveFeatureFlagMutateAsyncMock = mock(
  async (_args: { input: SaveFeatureFlagInput; name: string }): Promise<FeatureFlagEntry> => {
    throw new Error("saveFeatureFlagMutateAsyncMock not configured for this test.");
  },
);
export const updateSystemConfigurationMutateAsyncMock = mock(
  async (_args: {
    name: string;
    value: UpdateSystemConfigurationInput["value"];
  }): Promise<SystemConfigurationEntry> => {
    throw new Error("updateSystemConfigurationMutateAsyncMock not configured for this test.");
  },
);

export const useFeatureFlagsMock = mock(
  (): {
    data: FeatureFlagListResponse | undefined;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    refetch: typeof adminRefetchMock;
  } => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: adminRefetchMock,
  }),
);

export const useSaveFeatureFlagMock = mock(
  (): {
    mutateAsync: typeof saveFeatureFlagMutateAsyncMock;
    isPending: boolean;
  } => ({
    mutateAsync: saveFeatureFlagMutateAsyncMock,
    isPending: false,
  }),
);

export const useSystemConfigurationsMock = mock(
  (): {
    data: SystemConfigurationListResponse | undefined;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    refetch: typeof adminRefetchMock;
  } => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: adminRefetchMock,
  }),
);

export const useUpdateSystemConfigurationMock = mock(
  (): {
    mutateAsync: typeof updateSystemConfigurationMutateAsyncMock;
    isPending: boolean;
  } => ({
    mutateAsync: updateSystemConfigurationMutateAsyncMock,
    isPending: false,
  }),
);

export const useAdminAnalyticsMock = mock(
  (): {
    data: AnalyticsDashboard | undefined;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    refetch: typeof adminRefetchMock;
  } => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: adminRefetchMock,
  }),
);

export function resetAdminHooksModuleMock(): void {
  adminRefetchMock.mockReset();
  adminRefetchMock.mockImplementation(async () => undefined);

  saveFeatureFlagMutateAsyncMock.mockReset();
  saveFeatureFlagMutateAsyncMock.mockImplementation(async () => {
    throw new Error("saveFeatureFlagMutateAsyncMock not configured for this test.");
  });

  updateSystemConfigurationMutateAsyncMock.mockReset();
  updateSystemConfigurationMutateAsyncMock.mockImplementation(async () => {
    throw new Error("updateSystemConfigurationMutateAsyncMock not configured for this test.");
  });

  useFeatureFlagsMock.mockReset();
  useFeatureFlagsMock.mockImplementation(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: adminRefetchMock,
  }));

  useSaveFeatureFlagMock.mockReset();
  useSaveFeatureFlagMock.mockImplementation(() => ({
    mutateAsync: saveFeatureFlagMutateAsyncMock,
    isPending: false,
  }));

  useSystemConfigurationsMock.mockReset();
  useSystemConfigurationsMock.mockImplementation(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: adminRefetchMock,
  }));

  useUpdateSystemConfigurationMock.mockReset();
  useUpdateSystemConfigurationMock.mockImplementation(() => ({
    mutateAsync: updateSystemConfigurationMutateAsyncMock,
    isPending: false,
  }));

  useAdminAnalyticsMock.mockReset();
  useAdminAnalyticsMock.mockImplementation(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    refetch: adminRefetchMock,
  }));
}

resetAdminHooksModuleMock();

mock.module("@/hooks/useAdmin", () => ({
  useAdminAnalytics: useAdminAnalyticsMock,
  useFeatureFlags: useFeatureFlagsMock,
  useSaveFeatureFlag: useSaveFeatureFlagMock,
  useSystemConfigurations: useSystemConfigurationsMock,
  useUpdateSystemConfiguration: useUpdateSystemConfigurationMock,
}));
