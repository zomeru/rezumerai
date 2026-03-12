import { prisma } from "@rezumerai/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import AnalyticsDashboardPageClient from "@/components/Admin/AnalyticsDashboardPageClient";
import { AdminService } from "@/elysia-api/modules/admin/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminAnalyticsPage(): Promise<React.JSX.Element> {
  const timeframeDays = 7;
  const queryClient = getQueryClient();
  const data = await AdminService.getAnalyticsDashboard(prisma, timeframeDays);

  queryClient.setQueryData(queryKeys.admin.analytics(timeframeDays), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnalyticsDashboardPageClient />
    </HydrationBoundary>
  );
}
