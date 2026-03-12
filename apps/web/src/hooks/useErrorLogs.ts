import type { ErrorLogDetail, ErrorLogListResponse } from "@rezumerai/types";
import { ErrorLogDetailSchema, ErrorLogListResponseSchema } from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiWithoutDateParsing } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

interface ErrorLogListQuery {
  page: number;
  pageSize: number;
  isRead?: boolean;
}

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

function normalizeErrorLogDetail(data: ErrorLogDetail): ErrorLogDetail {
  return {
    ...data,
    queryParams: data.queryParams ?? null,
    requestBody: data.requestBody ?? null,
    headers: data.headers ?? null,
    readByUser: data.readByUser ?? null,
    functionName: data.functionName ?? null,
    userId: data.userId ?? null,
    readByUserId: data.readByUserId ?? null,
    readAt: data.readAt ?? null,
  };
}

export function useAdminErrorLogs(
  query: ErrorLogListQuery,
  options?: Omit<QueryOptions<ErrorLogListResponse>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.errorLogs(query),
    queryFn: async (): Promise<ErrorLogListResponse> => {
      const requestQuery: {
        page: string;
        pageSize: string;
        isRead?: "true" | "false";
      } = {
        page: String(query.page),
        pageSize: String(query.pageSize),
      };

      if (typeof query.isRead === "boolean") {
        requestQuery.isRead = query.isRead ? "true" : "false";
      }

      const { data, error } = await apiWithoutDateParsing.admin.errors.get({
        query: requestQuery,
      });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load error logs."));
      }

      if (!data) {
        throw new Error("Invalid error log list response.");
      }

      return ErrorLogListResponseSchema.parse(data);
    },
    ...options,
  });
}

export function useAdminErrorLogDetail(
  id: string,
  options?: Omit<QueryOptions<ErrorLogDetail>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.errorLogDetail(id),
    enabled: id.length > 0,
    queryFn: async (): Promise<ErrorLogDetail> => {
      const { data, error } = await apiWithoutDateParsing.admin.errors({ id }).get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load error detail."));
      }

      if (!data) {
        throw new Error("Invalid error detail response.");
      }

      return normalizeErrorLogDetail(ErrorLogDetailSchema.parse(data));
    },
    ...options,
  });
}

export function useMarkAdminErrorAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ErrorLogDetail> => {
      const { data, error } = await apiWithoutDateParsing.admin.errors({ id }).read.patch();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to mark error as read."));
      }

      if (!data) {
        throw new Error("Invalid mark-as-read response.");
      }

      return normalizeErrorLogDetail(ErrorLogDetailSchema.parse(data));
    },
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "error-logs"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.errorLogDetail(id) });
    },
  });
}
