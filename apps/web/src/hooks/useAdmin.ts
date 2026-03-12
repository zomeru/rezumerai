import type {
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserPasswordUpdateInput,
  AdminUserRoleUpdateInput,
  AnalyticsDashboard,
  AuditLogCategory,
  AuditLogDetail,
  AuditLogListResponse,
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

      const { data, error } = await apiWithoutDateParsing.admin.users.get({ query: requestQuery });

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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.systemConfig() });
      await queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
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
      const { data, error } = await apiWithoutDateParsing.admin["audit-logs"]({ id: auditId }).get();

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
