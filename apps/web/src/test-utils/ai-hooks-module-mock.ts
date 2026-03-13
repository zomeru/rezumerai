import { mock } from "bun:test";
import type { AiSettings } from "@rezumerai/types";
import type { InfiniteData } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import type { AssistantMessagesResponse } from "@/hooks/useAi";

export const refetchAiSettingsMock = mock(async () => undefined);
export const updateSelectedAiModelMutateAsyncMock = mock(async (_modelId: string): Promise<AiSettings> => {
  throw new Error("updateSelectedAiModelMutateAsyncMock not configured for this test.");
});
export const fetchNextAssistantPageMock = mock(async () => undefined);

export const useAiSettingsMock = mock(
  (_options?: {
    enabled?: boolean;
  }): {
    data: AiSettings | undefined;
    error: Error | null;
    isLoading: boolean;
    refetch: typeof refetchAiSettingsMock;
  } => ({
    data: undefined,
    error: null,
    isLoading: false,
    refetch: refetchAiSettingsMock,
  }),
);

export const useUpdateSelectedAiModelMock = mock(
  (): {
    isPending: boolean;
    mutateAsync: typeof updateSelectedAiModelMutateAsyncMock;
  } => ({
    isPending: false,
    mutateAsync: updateSelectedAiModelMutateAsyncMock,
  }),
);

export const useAssistantMessageHistoryMock = mock(
  (): {
    data: InfiniteData<AssistantMessagesResponse> | undefined;
    fetchNextPage: typeof fetchNextAssistantPageMock;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isLoading: boolean;
  } => ({
    data: undefined,
    fetchNextPage: fetchNextAssistantPageMock,
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
);

export function createAssistantMessagesResponse(messages: UIMessage[]): InfiniteData<AssistantMessagesResponse> {
  return {
    pageParams: [null],
    pages: [
      {
        scope: "USER",
        messages,
        nextCursor: null,
        hasMore: false,
      },
    ],
  };
}

export function resetAiHooksModuleMock(): void {
  refetchAiSettingsMock.mockReset();
  refetchAiSettingsMock.mockImplementation(async () => undefined);

  updateSelectedAiModelMutateAsyncMock.mockReset();
  updateSelectedAiModelMutateAsyncMock.mockImplementation(async () => {
    throw new Error("updateSelectedAiModelMutateAsyncMock not configured for this test.");
  });

  fetchNextAssistantPageMock.mockReset();
  fetchNextAssistantPageMock.mockImplementation(async () => undefined);

  useAiSettingsMock.mockReset();
  useAiSettingsMock.mockImplementation(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    refetch: refetchAiSettingsMock,
  }));

  useUpdateSelectedAiModelMock.mockReset();
  useUpdateSelectedAiModelMock.mockImplementation(() => ({
    isPending: false,
    mutateAsync: updateSelectedAiModelMutateAsyncMock,
  }));

  useAssistantMessageHistoryMock.mockReset();
  useAssistantMessageHistoryMock.mockImplementation(() => ({
    data: undefined,
    fetchNextPage: fetchNextAssistantPageMock,
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  }));
}

resetAiHooksModuleMock();

mock.module("@/hooks/useAi", () => ({
  useAiSettings: useAiSettingsMock,
  useAssistantMessageHistory: useAssistantMessageHistoryMock,
  useUpdateSelectedAiModel: useUpdateSelectedAiModelMock,
}));
