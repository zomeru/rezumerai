import type { ResumeWithRelations } from "@rezumerai/types";
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

  const { data, error } = await api.resumes({ id: resumeId }).get({
    headers: Object.fromEntries((await headers()).entries()),
  });

  if (error || !data) {
    notFound();
  }

  return <ResumeBuilderClient serverResume={data as ResumeWithRelations} resumeId={resumeId} />;
}
