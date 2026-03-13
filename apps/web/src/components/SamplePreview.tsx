"use client";

import type { ResumeWithRelations } from "@rezumerai/types";
import { useResumeById } from "@/hooks/useResume";
import { ResumePreview } from "./ResumeBuilder";

interface PreviewClientProps {
  serverData: ResumeWithRelations;
  resumeId: string;
}

export default function PreviewClient({ serverData, resumeId }: PreviewClientProps) {
  const { data } = useResumeById(resumeId);

  const resumeData: ResumeWithRelations = data ?? serverData;

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
