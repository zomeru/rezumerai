import { prisma } from "@rezumerai/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import SystemConfigurationPageClient from "@/components/Admin/SystemConfigurationPageClient";
import { AdminService } from "@/elysia-api/modules/admin/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminSystemConfigurationPage(): Promise<React.JSX.Element> {
  const queryClient = getQueryClient();
  const data = await AdminService.listSystemConfigurations(prisma);

  queryClient.setQueryData(queryKeys.admin.systemConfig(), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SystemConfigurationPageClient />
    </HydrationBoundary>
  );
}
