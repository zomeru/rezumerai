import type { AiSettings } from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ERROR_MESSAGES } from "@/constants/errors";
import { api } from "@/lib/api";

const AI_SETTINGS_QUERY_KEY = ["aiSettings"] as const;

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

      return data as AiSettings;
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

      return data as AiSettings;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AI_SETTINGS_QUERY_KEY });
    },
  });
}
