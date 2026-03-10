import type {
  AiSettings,
  AssistantChatInput,
  AssistantChatResponse,
  AssistantHistoryResponse,
  ResumeCopilotOptimizeInput,
  ResumeCopilotOptimizeResponse,
  ResumeCopilotReviewInput,
  ResumeCopilotReviewResponse,
  ResumeCopilotTailorInput,
  ResumeCopilotTailorResponse,
} from "@rezumerai/types";
import {
  AiSettingsSchema,
  AssistantChatResponseSchema,
  AssistantHistoryResponseSchema,
  ResumeCopilotOptimizeResponseSchema,
  ResumeCopilotReviewResponseSchema,
  ResumeCopilotTailorResponseSchema,
} from "@rezumerai/types";
import {
  type InfiniteData,
  type QueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ERROR_MESSAGES } from "@/constants/errors";
import { api } from "@/lib/api";

const AI_SETTINGS_QUERY_KEY = ["aiSettings"] as const;
const ASSISTANT_HISTORY_QUERY_KEY = ["assistantHistory"] as const;

function getApiErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "object" && value !== null && "message" in value && typeof value.message === "string") {
    return value.message;
  }

  return fallback;
}

export function useAiSettings(
  options?: Omit<QueryOptions<AiSettings>, "queryKey" | "queryFn"> & { enabled?: boolean },
) {
  return useQuery({
    queryKey: AI_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.ai.settings.get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_SETTINGS_LOAD_FAILED));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_SETTINGS_INVALID_RESPONSE);
      }

      return AiSettingsSchema.parse(data);
    },
    ...options,
  });
}

export function useUpdateSelectedAiModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string): Promise<AiSettings> => {
      const { data, error } = await api.ai.settings.model.patch({ modelId });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_MODEL_UPDATE_FAILED));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_MODEL_UPDATE_INVALID_RESPONSE);
      }

      return AiSettingsSchema.parse(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEY });
    },
  });
}

export function useAssistantChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AssistantChatInput): Promise<AssistantChatResponse> => {
      const { data, error } = await api.ai.assistant.chat.post(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
      }

      return AssistantChatResponseSchema.parse(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ASSISTANT_HISTORY_QUERY_KEY });
    },
  });
}

export function useAssistantHistory(options?: { enabled?: boolean; limit?: number; threadId?: string | null }) {
  const limit = options?.limit ?? 20;
  const threadId = options?.threadId ?? null;

  return useInfiniteQuery<
    AssistantHistoryResponse,
    Error,
    InfiniteData<AssistantHistoryResponse>,
    readonly ["assistantHistory", string, number],
    string | null
  >({
    queryKey: [...ASSISTANT_HISTORY_QUERY_KEY, threadId ?? "missing-thread", limit],
    enabled: (options?.enabled ?? true) && typeof threadId === "string" && threadId.length > 0,
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<AssistantHistoryResponse> => {
      if (!threadId) {
        throw new Error(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
      }

      const query: { threadId: string; limit: number; cursor?: string } = {
        threadId,
        limit,
      };

      if (pageParam) {
        query.cursor = pageParam;
      }

      const { data, error } = await api.ai.assistant.history.get({ query });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
      }

      return AssistantHistoryResponseSchema.parse(data);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCopilotOptimizeSection() {
  return useMutation({
    mutationFn: async (input: ResumeCopilotOptimizeInput): Promise<ResumeCopilotOptimizeResponse> => {
      const { data, error } = await api.ai.copilot["optimize-section"].post(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
      }

      return ResumeCopilotOptimizeResponseSchema.parse(data);
    },
  });
}

export function useCopilotTailorResume() {
  return useMutation({
    mutationFn: async (input: ResumeCopilotTailorInput): Promise<ResumeCopilotTailorResponse> => {
      const { data, error } = await api.ai.copilot.tailor.post(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
      }

      return ResumeCopilotTailorResponseSchema.parse(data);
    },
  });
}

export function useCopilotReviewResume() {
  return useMutation({
    mutationFn: async (input: ResumeCopilotReviewInput): Promise<ResumeCopilotReviewResponse> => {
      const { data, error } = await api.ai.copilot.review.post(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, ERROR_MESSAGES.AI_COPILOT_RUN_FAILED));
      }

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_COPILOT_RUN_FAILED);
      }

      return ResumeCopilotReviewResponseSchema.parse(data);
    },
  });
}
