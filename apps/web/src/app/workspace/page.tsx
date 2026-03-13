import { prisma } from "@rezumerai/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import WorkspaceDashboardPageClient from "@/components/Dashboard/WorkspaceDashboardPageClient";
import { ResumeService } from "@/elysia-api/modules/resume/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { getServerSessionIdentity } from "@/lib/server-runtime";

export default async function Dashboard() {
  const { userId } = await getServerSessionIdentity();

  if (!userId) {
    notFound();
  }

  const queryClient = getQueryClient();
  const resumes = await ResumeService.search(prisma, userId, {});
  queryClient.setQueryData(queryKeys.resumes.list(), resumes);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceDashboardPageClient />
    </HydrationBoundary>
  );
}
