type SearchInput = string | null | undefined;

function normalizeSearch(search: SearchInput): string {
  return search?.trim() ?? "";
}

export const queryKeys = {
  account: {
    settings: () => ["account", "settings"] as const,
  },
  admin: {
    analytics: (timeframeDays: number) => ["admin", "analytics", timeframeDays] as const,
    auditLogDetail: (auditId: string) => ["admin", "audit-logs", "detail", auditId] as const,
    auditLogs: (query: { page: number; pageSize: number; search?: SearchInput; category?: string | null }) =>
      [
        "admin",
        "audit-logs",
        query.page,
        query.pageSize,
        normalizeSearch(query.search),
        query.category ?? "all",
      ] as const,
    errorLogDetail: (id: string) => ["admin", "error-logs", "detail", id] as const,
    errorLogs: (query: { page: number; pageSize: number; isRead?: boolean }) =>
      ["admin", "error-logs", query.page, query.pageSize, query.isRead ?? "all"] as const,
    systemConfig: () => ["admin", "system-config"] as const,
    userDetail: (userId: string) => ["admin", "users", "detail", userId] as const,
    users: (query: { page: number; pageSize: number; search?: SearchInput; role?: string | null }) =>
      ["admin", "users", query.page, query.pageSize, normalizeSearch(query.search), query.role ?? "all"] as const,
  },
  ai: {
    assistantMessages: (options: { identityKey?: string | null; limit: number; threadId?: string | null }) =>
      [
        "ai",
        "assistant-messages",
        options.threadId ?? "missing-thread",
        options.limit,
        options.identityKey ?? "missing-identity",
      ] as const,
    settings: () => ["ai", "settings"] as const,
  },
  resumes: {
    all: () => ["resumes"] as const,
    detail: (id: string) => ["resumes", "detail", id] as const,
    list: (search?: SearchInput) => ["resumes", "list", normalizeSearch(search)] as const,
  },
} as const;
