import type {
  AdminAiModel,
  AdminAiModelCatalog,
  AdminAiModelMutationInput,
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserRoleUpdateInput,
  AnalyticsDashboard,
  AuditLogCategory,
  AuditLogDetail,
  AuditLogListResponse,
  DeleteAdminAiModelResponse,
  SystemConfigurationEntry,
  SystemConfigurationListResponse,
  UpdateSystemConfigurationInput,
} from "@rezumerai/types";
import { type QueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;
const ADMIN_SYSTEM_CONFIG_QUERY_KEY = ["admin", "system-config"] as const;
const ADMIN_AI_MODELS_QUERY_KEY = ["admin", "ai-models"] as const;
const ADMIN_AUDIT_LOGS_QUERY_KEY = ["admin", "audit-logs"] as const;
const ADMIN_ANALYTICS_QUERY_KEY = ["admin", "analytics"] as const;

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
    queryKey: [...ADMIN_USERS_QUERY_KEY, query.page, query.pageSize, query.search ?? "", query.role ?? "all"],
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

      const { data, error } = await api.admin.users.get({ query: requestQuery });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load users."));
      }

      if (!data) {
        throw new Error("Invalid users response.");
      }

      return data as AdminUserListResponse;
    },
    ...options,
  });
}

export function useAdminUserDetail(
  userId: string,
  options?: Omit<QueryOptions<AdminUserDetail>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, "detail", userId],
    enabled: userId.length > 0,
    queryFn: async (): Promise<AdminUserDetail> => {
      const { data, error } = await api.admin.users({ id: userId }).get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load user detail."));
      }

      if (!data) {
        throw new Error("Invalid user detail response.");
      }

      return data as AdminUserDetail;
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
      const { data, error } = await api.admin.users({ id: userId }).role.patch({ role });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update user role."));
      }

      if (!data) {
        throw new Error("Invalid user role update response.");
      }

      return data as AdminUserDetail;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: [...ADMIN_USERS_QUERY_KEY, "detail", variables.userId] });
      await queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}

export function useSystemConfigurations(
  options?: Omit<QueryOptions<SystemConfigurationListResponse>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ADMIN_SYSTEM_CONFIG_QUERY_KEY,
    queryFn: async (): Promise<SystemConfigurationListResponse> => {
      const { data, error } = await api.admin["system-config"].get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load system configuration."));
      }

      if (!data) {
        throw new Error("Invalid system configuration response.");
      }

      return data as SystemConfigurationListResponse;
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
      const { data, error } = await api.admin["system-config"]({ name }).patch({ value });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update system configuration."));
      }

      if (!data) {
        throw new Error("Invalid system configuration update response.");
      }

      return data as SystemConfigurationEntry;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_SYSTEM_CONFIG_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}

export function useAdminAiModels(options?: Omit<QueryOptions<AdminAiModelCatalog>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ADMIN_AI_MODELS_QUERY_KEY,
    queryFn: async (): Promise<AdminAiModelCatalog> => {
      const { data, error } = await api.admin["ai-models"].get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load AI models."));
      }

      if (!data) {
        throw new Error("Invalid AI models response.");
      }

      return data as AdminAiModelCatalog;
    },
    ...options,
  });
}

export function useCreateAdminAiModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminAiModelMutationInput): Promise<AdminAiModel> => {
      const { data, error } = await api.admin["ai-models"].post(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to create AI model."));
      }

      if (!data) {
        throw new Error("Invalid AI model create response.");
      }

      return data as AdminAiModel;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_AI_MODELS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}

export function useUpdateAdminAiModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AdminAiModelMutationInput }): Promise<AdminAiModel> => {
      const { data, error } = await api.admin["ai-models"]({ id }).patch(input);

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to update AI model."));
      }

      if (!data) {
        throw new Error("Invalid AI model update response.");
      }

      return data as AdminAiModel;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_AI_MODELS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}

export function useDeleteAdminAiModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<DeleteAdminAiModelResponse> => {
      const { data, error } = await api.admin["ai-models"]({ id }).delete();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to delete AI model."));
      }

      if (!data) {
        throw new Error("Invalid AI model delete response.");
      }

      return data as DeleteAdminAiModelResponse;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_AI_MODELS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_LOGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
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
    queryKey: [...ADMIN_AUDIT_LOGS_QUERY_KEY, query.page, query.pageSize, query.search ?? "", query.category ?? "all"],
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

      const { data, error } = await api.admin["audit-logs"].get({ query: requestQuery });

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load audit logs."));
      }

      if (!data) {
        throw new Error("Invalid audit logs response.");
      }

      return data as AuditLogListResponse;
    },
    ...options,
  });
}

export function useAuditLogDetail(
  auditId: string,
  options?: Omit<QueryOptions<AuditLogDetail>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [...ADMIN_AUDIT_LOGS_QUERY_KEY, "detail", auditId],
    enabled: auditId.length > 0,
    queryFn: async (): Promise<AuditLogDetail> => {
      const { data, error } = await api.admin["audit-logs"]({ id: auditId }).get();

      if (error) {
        throw new Error(getApiErrorMessage(error.value, "Failed to load audit log detail."));
      }

      if (!data) {
        throw new Error("Invalid audit log detail response.");
      }

      return data as AuditLogDetail;
    },
    ...options,
  });
}

export function useAdminAnalytics(
  timeframeDays: number,
  options?: Omit<QueryOptions<AnalyticsDashboard>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: [...ADMIN_ANALYTICS_QUERY_KEY, timeframeDays],
    queryFn: async (): Promise<AnalyticsDashboard> => {
      const { data, error } = await api.admin.analytics.get({
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

      return data as AnalyticsDashboard;
    },
    ...options,
  });
}
