import type { ResumeWithRelations } from "@rezumerai/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { SamplePreview } from "@/components";
import { DUMMY_RESUME_DATA_ID, DUMMY_RESUME_PREVIEW_DATA } from "@/constants/dummy";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";
import { getOwnedResumeForCurrentUser } from "@/lib/server-runtime";

interface PreviewPageProps {
  params: Promise<{
    resumeId: string;
  }>;
}

/**
 * Full-screen resume preview page for a single resume.
 */
export default async function Preview({ params }: PreviewPageProps) {
  "use server";
  const { resumeId } = await params;

  const isDummyData = resumeId === DUMMY_RESUME_DATA_ID;

  if (isDummyData) {
    return <SamplePreview serverData={DUMMY_RESUME_PREVIEW_DATA} resumeId={resumeId} />;
  }

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
      <SamplePreview serverData={resume as ResumeWithRelations} resumeId={resumeId} />
    </HydrationBoundary>
  );
}
