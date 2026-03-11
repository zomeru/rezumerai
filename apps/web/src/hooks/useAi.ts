import type {
  AiSettings,
  ResumeCopilotOptimizeInput,
  ResumeCopilotOptimizeResponse,
  ResumeCopilotReviewInput,
  ResumeCopilotReviewResponse,
  ResumeCopilotTailorInput,
  ResumeCopilotTailorResponse,
} from "@rezumerai/types";
import {
  AiSettingsSchema,
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
import type { UIMessage } from "ai";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { api } from "@/lib/api";

const AI_SETTINGS_QUERY_KEY = ["aiSettings"] as const;
const ASSISTANT_MESSAGES_QUERY_KEY = ["assistantMessages"] as const;

const AssistantUiMessageSchema: z.ZodType<UIMessage> = z
  .object({
    id: z.string().trim().min(1),
    role: z.enum(["system", "user", "assistant"]),
    parts: z.array(z.unknown()),
  })
  .transform((value) => value as UIMessage);

const AssistantMessagesResponseSchema = z.object({
  scope: z.enum(["PUBLIC", "USER", "ADMIN"]),
  messages: z.array(AssistantUiMessageSchema),
  nextCursor: z.string().trim().min(1).nullable(),
  hasMore: z.boolean(),
});

export type AssistantMessagesResponse = z.infer<typeof AssistantMessagesResponseSchema>;

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

export function useAssistantMessageHistory(options?: {
  enabled?: boolean;
  identityKey?: string | null;
  limit?: number;
  threadId?: string | null;
}) {
  const limit = options?.limit ?? 20;
  const identityKey = options?.identityKey ?? null;
  const threadId = options?.threadId ?? null;

  return useInfiniteQuery<
    AssistantMessagesResponse,
    Error,
    InfiniteData<AssistantMessagesResponse>,
    readonly ["assistantMessages", string, number, string],
    string | null
  >({
    queryKey: [...ASSISTANT_MESSAGES_QUERY_KEY, threadId ?? "missing-thread", limit, identityKey ?? "missing-identity"],
    enabled:
      (options?.enabled ?? true) &&
      typeof threadId === "string" &&
      threadId.length > 0 &&
      typeof identityKey === "string" &&
      identityKey.length > 0,
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<AssistantMessagesResponse> => {
      if (!threadId) {
        throw new Error(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
      }

      const params = new URLSearchParams({
        threadId,
        limit: String(limit),
      });

      if (pageParam) {
        params.set("cursor", pageParam);
      }

      const response = await fetch(`/api/ai/assistant/messages?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
      }

      const data = await response.json();

      if (!data) {
        throw new Error(ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR);
      }

      return AssistantMessagesResponseSchema.parse(data);
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
