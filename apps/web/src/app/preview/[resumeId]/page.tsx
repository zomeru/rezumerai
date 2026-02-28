"use client";

import type { ResumeWithRelations } from "@rezumerai/types";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader } from "@/components";
import { ResumePreview } from "@/components/ResumeBuilder";
import { DUMMY_RESUME_DATA_ID, DUMMY_RESUME_PREVIEW_DATA } from "@/constants/dummy";
import { useResumeById } from "@/hooks/useResume";

/**
 * Full-screen resume preview page for a single resume.
 */
export default function Preview() {
  const { resumeId } = useParams<{
    resumeId: string;
  }>();
  const isDummyData = resumeId === DUMMY_RESUME_DATA_ID;

  const { data, isFetching } = useResumeById(resumeId);

  const resumeData: ResumeWithRelations | null = isDummyData ? DUMMY_RESUME_PREVIEW_DATA : (data ?? null);

  if (isFetching) {
    return <Loader />;
  }

  if (!resumeData) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-center font-semibold text-6xl text-slate-400">Resume not found</p>
        <Link href="/">
          <div className="m-1 mt-6 flex items-center rounded-full bg-primary-500 px-6 py-2 text-2xl text-white ring-1 ring-primary-400 ring-offset-1 transition-colors hover:bg-primary-600">
            <ArrowLeftIcon className="mr-2 size-4" />
            Go to home page
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl py-10">
        <ResumePreview
          data={resumeData}
          template={resumeData.template}
          accentColor={resumeData.accentColor}
          previewMode="html"
          className="bg-white py-4"
        />
      </div>
    </div>
  );
}
