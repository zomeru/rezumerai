import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SamplePreview } from "@/components";
import { DUMMY_RESUME_DATA_ID, DUMMY_RESUME_PREVIEW_DATA } from "@/constants/dummy";
import { api } from "@/lib/api";

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

  const headersList = (await headers()) as unknown as Record<string, string>;

  const { data, error } = await api.resumes({ id: resumeId }).get({
    headers: headersList,
  });

  if (error || !data) {
    notFound();
  }

  return <SamplePreview serverData={data} resumeId={resumeId} />;
}
