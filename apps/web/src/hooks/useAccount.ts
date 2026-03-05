import type { UpdateUserAccountInput, UserAccountSettings } from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ACCOUNT_QUERY_KEY = ["accountSettings"] as const;

function getApiErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") {
    return value.error;
  }

  if (typeof value === "object" && value !== null && "message" in value && typeof value.message === "string") {
    return value.message;
  }

  return fallback;
}

export function useAccountSettings(options?: Omit<QueryOptions<UserAccountSettings>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.users.me.get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load account settings."));
      }

      if (!data) {
        throw new Error("Invalid account settings response.");
      }

      return data as UserAccountSettings;
    },
    ...options,
  });
}

export function useUpdateAccountSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateUserAccountInput) => {
      const { data, error } = await api.users.me.patch(updates);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update account settings."));
      }

      if (!data) {
        throw new Error("Invalid account update response.");
      }

      return data as UserAccountSettings;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
    },
  });
}
