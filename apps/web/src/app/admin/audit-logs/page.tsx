import { prisma } from "@rezumerai/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import AuditLogsPageClient from "@/components/Admin/AuditLogsPageClient";
import { AdminService } from "@/elysia-api/modules/admin/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminAuditLogsPage(): Promise<React.JSX.Element> {
  const initialQuery = {
    page: 1,
    pageSize: 50,
    search: "",
    category: "USER_ACTION" as const,
  };
  const queryClient = getQueryClient();
  const data = await AdminService.listAuditLogs(prisma, {
    page: initialQuery.page,
    pageSize: initialQuery.pageSize,
    search: undefined,
    category: initialQuery.category,
  });

  queryClient.setQueryData(queryKeys.admin.auditLogs(initialQuery), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuditLogsPageClient />
    </HydrationBoundary>
  );
}
