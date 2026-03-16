import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { QueueDashboardPageClient } from "@/components/Admin/queue/QueueDashboardPageClient";
import { QueueService } from "@/elysia-api/modules/admin/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

export default async function AdminQueuePage(): Promise<React.JSX.Element> {
  const queryClient = getQueryClient();
  const data = await QueueService.getQueueMetrics();

  queryClient.setQueryData(queryKeys.admin.queueMetrics(), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <QueueDashboardPageClient />
    </HydrationBoundary>
  );
}
