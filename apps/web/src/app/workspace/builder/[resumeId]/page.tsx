import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ResumeBuilderClient from "@/components/ResumeBuilder/ResumeBuilderClientPage";
import { api } from "@/lib/api";

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

  const headersList = (await headers()) as unknown as Record<string, string>;

  const { data, error } = await api.resumes({ id: resumeId }).get({
    headers: headersList,
  });

  if (error || !data) {
    notFound();
  }

  return <ResumeBuilderClient serverResume={data} resumeId={resumeId} />;
}
