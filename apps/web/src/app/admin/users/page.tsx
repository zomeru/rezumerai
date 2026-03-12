import { prisma } from "@rezumerai/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import UserListPageClient from "@/components/Admin/UserListPageClient";
import { AdminService } from "@/elysia-api/modules/admin/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminUsersPage(): Promise<React.JSX.Element> {
  const initialQuery = {
    page: 1,
    pageSize: 50,
    search: "",
    role: "all" as const,
  };
  const queryClient = getQueryClient();
  const data = await AdminService.listUsers(prisma, {
    page: initialQuery.page,
    pageSize: initialQuery.pageSize,
    search: undefined,
    role: null,
  });

  queryClient.setQueryData(queryKeys.admin.users(initialQuery), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserListPageClient />
    </HydrationBoundary>
  );
}
