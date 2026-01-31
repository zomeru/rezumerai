"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "@/components";
import { ResumePreview } from "@/components/ResumeBuilder";
import { dummyResumeData, type Resume } from "@/constants/dummy";

export default function Preview() {
  const { resumeId } = useParams<{
    resumeId: string;
  }>();
  const [resumeData, setResumeData] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const resume = dummyResumeData.find((r) => r._id === resumeId) || null;
        setResumeData(resume);
      } catch (error) {
        console.error("Error fetching resume data:", error);
      } finally {
        setIsLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [resumeId]);

  if (isLoading) {
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
    <div className="h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl bg-red py-10">
        <ResumePreview
          data={resumeData}
          template={resumeData.template}
          accentColor={resumeData.accentColor}
          className="bg-white py-4"
        />
      </div>
    </div>
  );
}
