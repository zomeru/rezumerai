import type { ResumeWithRelations } from "@rezumerai/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import ResumeBuilderClient from "@/components/ResumeBuilder/ResumeBuilderClientPage";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { getOwnedResumeForCurrentUser } from "@/lib/server-runtime";

interface ResumeBuilderPageProps {
  params: Promise<{
    resumeId: string;
  }>;
}

export default async function ResumeBuilderPage({ params }: ResumeBuilderPageProps) {
  const { resumeId } = await params;

  if (!resumeId) {
    notFound();
  }

  const resume = await getOwnedResumeForCurrentUser(resumeId);

  if (!resume) {
    notFound();
  }

  const queryClient = getQueryClient();
  queryClient.setQueryData(queryKeys.resumes.detail(resumeId), resume);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResumeBuilderClient serverResume={resume as ResumeWithRelations} resumeId={resumeId} />
    </HydrationBoundary>
  );
}
