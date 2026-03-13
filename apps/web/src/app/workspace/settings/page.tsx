import { prisma } from "@rezumerai/database";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import WorkspaceSettingsPageClient from "@/components/WorkspaceSettingsPageClient";
import { AiService } from "@/elysia-api/modules/ai/service";
import { ProfileService } from "@/elysia-api/modules/profile/service";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { getServerSessionIdentity } from "@/lib/server-runtime";

export default async function WorkspaceSettingsPage(): Promise<React.JSX.Element> {
  const { userId } = await getServerSessionIdentity();

  if (!userId) {
    notFound();
  }

  const queryClient = getQueryClient();
  const accountSettings = await ProfileService.getAccountSettings(prisma, userId);

  if (!accountSettings) {
    notFound();
  }

  queryClient.setQueryData(queryKeys.account.settings(), accountSettings);

  if (accountSettings.user.emailVerified) {
    const aiSettings = await AiService.getUserAiSettings(prisma, userId);
    queryClient.setQueryData(queryKeys.ai.settings(), aiSettings);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceSettingsPageClient />
    </HydrationBoundary>
  );
}
