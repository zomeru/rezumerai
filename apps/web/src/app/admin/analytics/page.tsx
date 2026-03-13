import { prisma } from "@rezumerai/database";
import { FEATURE_FLAG_NAMES } from "@rezumerai/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import AnalyticsDashboardVariantClient from "@/components/Admin/AnalyticsDashboardVariantClient";
import { AdminService } from "@/elysia-api/modules/admin/service";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { getServerSessionIdentity } from "@/lib/server-runtime";

export default async function AdminAnalyticsPage(): Promise<React.JSX.Element> {
  const timeframeDays = 7;
  const queryClient = getQueryClient();
  const data = await AdminService.getAnalyticsDashboard(prisma, timeframeDays);
  const { userId } = await getServerSessionIdentity();
  const useInteractiveAnalyticsUi = await isFeatureEnabled(FEATURE_FLAG_NAMES.NEW_ADMIN_ANALYTICS_UI, {
    subjectKey: userId ?? null,
  });

  queryClient.setQueryData(queryKeys.admin.analytics(timeframeDays), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnalyticsDashboardVariantClient
        initialUseInteractiveAnalyticsUi={useInteractiveAnalyticsUi}
        subjectKey={userId ?? null}
      />
    </HydrationBoundary>
  );
}
