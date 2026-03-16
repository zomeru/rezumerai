import type {
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserPasswordUpdateInput,
  AdminUserRoleUpdateInput,
  AnalyticsDashboard,
  AuditLogCategory,
  AuditLogDetail,
  AuditLogListResponse,
  FeatureFlagEntry,
  FeatureFlagListResponse,
  SaveFeatureFlagInput,
  SystemConfigurationEntry,
  SystemConfigurationListResponse,
  UpdateSystemConfigurationInput,
} from "@rezumerai/types";
import {
  AdminUserDetailSchema,
  AdminUserListResponseSchema,
  AnalyticsDashboardSchema,
  AuditLogDetailSchema,
  AuditLogListResponseSchema,
  FeatureFlagEntrySchema,
  FeatureFlagListResponseSchema,
  SystemConfigurationEntrySchema,
  SystemConfigurationListResponseSchema,
} from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiWithoutDateParsing } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

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

export function useAdminUsers(
  query: {
    page: number;
    pageSize: number;
    search?: string;
    role?: "ADMIN" | "USER" | "all";
  },
  options?: Omit<QueryOptions<AdminUserListResponse>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.users(query),
    queryFn: async (): Promise<AdminUserListResponse> => {
      const requestQuery: {
        page: string;
        pageSize: string;
        search?: string;
        role?: "ADMIN" | "USER";
      } = {
        page: String(query.page),
        pageSize: String(query.pageSize),
      };

      if (query.search?.trim()) {
        requestQuery.search = query.search.trim();
      }

      if (query.role && query.role !== "all") {
        requestQuery.role = query.role;
      }

      const { data, error } = await apiWithoutDateParsing.admin.users.get({
        query: requestQuery,
      });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load users."));
      }

      if (!data) {
        throw new Error("Invalid users response.");
      }

      return AdminUserListResponseSchema.parse(data);
    },
    ...options,
  });
}

export function useAdminUserDetail(
  userId: string,
  options?: Omit<QueryOptions<AdminUserDetail>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.userDetail(userId),
    enabled: userId.length > 0,
    queryFn: async (): Promise<AdminUserDetail> => {
      const { data, error } = await apiWithoutDateParsing.admin.users({ id: userId }).get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load user detail."));
      }

      if (!data) {
        throw new Error("Invalid user detail response.");
      }

      return AdminUserDetailSchema.parse(data);
    },
    ...options,
  });
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: AdminUserRoleUpdateInput["role"];
    }): Promise<AdminUserDetail> => {
      const { data, error } = await apiWithoutDateParsing.admin.users({ id: userId }).role.patch({ role });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update user role."));
      }

      if (!data) {
        throw new Error("Invalid user role update response.");
      }

      return AdminUserDetailSchema.parse(data);
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(queryKeys.admin.userDetail(variables.userId), data);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "audit-logs"],
      });
    },
  });
}

export function useUpdateAdminUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      input,
    }: {
      userId: string;
      input: AdminUserPasswordUpdateInput;
    }): Promise<AdminUserDetail> => {
      const { data, error } = await apiWithoutDateParsing.admin.users({ id: userId }).password.patch(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update user password."));
      }

      if (!data) {
        throw new Error("Invalid user password update response.");
      }

      return AdminUserDetailSchema.parse(data);
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(queryKeys.admin.userDetail(variables.userId), data);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "audit-logs"],
      });
    },
  });
}

export function useSystemConfigurations(
  options?: Omit<QueryOptions<SystemConfigurationListResponse>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.systemConfig(),
    queryFn: async (): Promise<SystemConfigurationListResponse> => {
      const { data, error } = await apiWithoutDateParsing.admin["system-config"].get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load system configuration."));
      }

      if (!data) {
        throw new Error("Invalid system configuration response.");
      }

      return SystemConfigurationListResponseSchema.parse(data);
    },
    ...options,
  });
}

export function useUpdateSystemConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      value,
    }: {
      name: string;
      value: UpdateSystemConfigurationInput["value"];
    }): Promise<SystemConfigurationEntry> => {
      const { data, error } = await apiWithoutDateParsing.admin["system-config"]({ name }).patch({ value });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update system configuration."));
      }

      if (!data) {
        throw new Error("Invalid system configuration update response.");
      }

      return SystemConfigurationEntrySchema.parse(data);
    },
    onSuccess: async (updatedConfiguration) => {
      queryClient.setQueryData(
        queryKeys.admin.systemConfig(),
        (current: SystemConfigurationListResponse | undefined): SystemConfigurationListResponse | undefined => {
          if (!current) {
            return current;
          }

          const nextItems = current.items.some((item) => item.name === updatedConfiguration.name)
            ? current.items.map((item) => (item.name === updatedConfiguration.name ? updatedConfiguration : item))
            : [...current.items, updatedConfiguration].sort((left, right) => left.name.localeCompare(right.name));

          return {
            ...current,
            items: nextItems,
          };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "audit-logs"],
      });
    },
  });
}

export function useFeatureFlags(options?: Omit<QueryOptions<FeatureFlagListResponse>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.admin.features(),
    queryFn: async (): Promise<FeatureFlagListResponse> => {
      const { data, error } = await apiWithoutDateParsing.admin.features.get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load feature flags."));
      }

      if (!data) {
        throw new Error("Invalid feature flags response.");
      }

      return FeatureFlagListResponseSchema.parse(data);
    },
    ...options,
  });
}

export function useSaveFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, input }: { name: string; input: SaveFeatureFlagInput }): Promise<FeatureFlagEntry> => {
      const { data, error } = await apiWithoutDateParsing.admin.features({ name }).put(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to save feature flag."));
      }

      if (!data) {
        throw new Error("Invalid feature flag response.");
      }

      return FeatureFlagEntrySchema.parse(data);
    },
    onSuccess: async (savedFeatureFlag) => {
      queryClient.setQueryData(
        queryKeys.admin.features(),
        (current: FeatureFlagListResponse | undefined): FeatureFlagListResponse => {
          const currentItems = current?.items ?? [];
          const nextItems = currentItems.some((item) => item.name === savedFeatureFlag.name)
            ? currentItems.map((item) => (item.name === savedFeatureFlag.name ? savedFeatureFlag : item))
            : [...currentItems, savedFeatureFlag];

          return {
            items: nextItems.sort((left, right) => left.name.localeCompare(right.name)),
          };
        },
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "audit-logs"],
      });
    },
  });
}

export function useAuditLogs(
  query: {
    page: number;
    pageSize: number;
    search?: string;
    category?: AuditLogCategory;
  },
  options?: Omit<QueryOptions<AuditLogListResponse>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(query),
    queryFn: async (): Promise<AuditLogListResponse> => {
      const requestQuery: {
        page: string;
        pageSize: string;
        search?: string;
        category?: AuditLogCategory;
      } = {
        page: String(query.page),
        pageSize: String(query.pageSize),
      };

      if (query.search?.trim()) {
        requestQuery.search = query.search.trim();
      }

      if (query.category) {
        requestQuery.category = query.category;
      }

      const { data, error } = await apiWithoutDateParsing.admin["audit-logs"].get({ query: requestQuery });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load audit logs."));
      }

      if (!data) {
        throw new Error("Invalid audit logs response.");
      }

      return AuditLogListResponseSchema.parse(data);
    },
    ...options,
  });
}

export function useAuditLogDetail(
  auditId: string,
  options?: Omit<QueryOptions<AuditLogDetail>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogDetail(auditId),
    enabled: auditId.length > 0,
    queryFn: async (): Promise<AuditLogDetail> => {
      const { data, error } = await apiWithoutDateParsing.admin["audit-logs"]({
        id: auditId,
      }).get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load audit log detail."));
      }

      if (!data) {
        throw new Error("Invalid audit log detail response.");
      }

      return AuditLogDetailSchema.parse(data);
    },
    ...options,
  });
}

export function useAdminAnalytics(
  timeframeDays: number,
  options?: Omit<QueryOptions<AnalyticsDashboard>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.admin.analytics(timeframeDays),
    queryFn: async (): Promise<AnalyticsDashboard> => {
      const { data, error } = await apiWithoutDateParsing.admin.analytics.get({
        query: {
          timeframeDays: String(timeframeDays),
        },
      });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load analytics dashboard."));
      }

      if (!data) {
        throw new Error("Invalid analytics dashboard response.");
      }

      return AnalyticsDashboardSchema.parse(data);
    },
    ...options,
  });
}

export interface QueueMetricsData {
  initialized: boolean;
  queues: Record<
    string,
    {
      pending: number;
      active: number;
      completed: number;
      failed: number;
      retry: number;
      jobsPublished: number;
      jobsCompleted: number;
      jobsFailed: number;
      totalProcessingTimeMs: number;
      averageProcessingTimeMs: number;
      lastJobPublishedAt: string | null;
      lastJobCompletedAt: string | null;
      hitRate: number | null;
    }
  >;
  cache: {
    size: number;
    maxEntries: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
  };
  alerts: {
    totalAlerts: number;
    alertsByQueue: Record<string, number>;
    lastAlerts: Record<string, string>;
  };
}

export function useAdminQueueMetrics(
  options?: Omit<QueryOptions<QueueMetricsData>, "queryKey" | "queryFn"> & {
    refetchInterval?: number | false;
  },
) {
  return useQuery({
    queryKey: queryKeys.admin.queueMetrics(),
    queryFn: async (): Promise<QueueMetricsData> => {
      const response = await fetch("/api/admin/queue/metrics");
      if (!response.ok) {
        throw new Error("Failed to load queue metrics");
      }
      return response.json();
    },
    ...options,
  });
}
