// biome-ignore-all lint: Current file is under heavy development

"use client";

import { cn } from "@rezumerai/utils/styles";
import {
  ArrowLeftIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderIcon,
  GraduationCap,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ColorPicker, PersonalInfoForm, ResumePreview, TemplateSelector } from "@/components";
import { dummyResumeData, type ResumeData } from "@/constants/dummy";
import type { TemplateType } from "@/templates";

const sections = [
  { id: "personal", name: "Personal Information", icon: User },
  { id: "summary", name: "Summary", icon: FileText },
  { id: "experience", name: "Experience", icon: Briefcase },
  { id: "education", name: "Education", icon: GraduationCap },
  { id: "projects", name: "Projects", icon: FolderIcon },
  { id: "skills", name: "Skills", icon: Sparkles },
];

export default function ResumeBuilder() {
  const { resumeId } = useParams<{
    resumeId: string;
  }>();

  const [resumeData, setResumeData] = useState<null | ResumeData>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);

  const loadExistingResume = async () => {
    const resume = dummyResumeData.find((r) => r._id === resumeId) || null;
    setResumeData(resume);
    // document.title = resume ? `${resume.title} - Rezumer AI` : "Rezumer AI";
  };

  const updateResumeData = (data: ResumeData["personal_info"]) => {
    setResumeData((prev) => {
      return {
        ...prev,
        personal_info: data,
      };
    });
  };

  useEffect(() => {
    loadExistingResume();
  }, []);

  const activeSection = sections[activeSectionIndex];

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link href="/app" className="hover:slate-700 inline-flex items-center gap-2 text-slate-500 transition-all">
          <ArrowLeftIcon className="size-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Panel - Form */}
          <div className="relative overflow-hidden rounded-lg lg:col-span-5">
            <div className="rounded-lg border border-gray-200 bg-white p-6 pt-1 shadow-sm">
              {/* Progress bar using activeSectionIndex */}
              <hr className="absolute top-0 right-0 left-0 border-2 border-gray-200" />
              <hr
                className="absolute top-0 left-0 h-1 border-none bg-linear-to-r from-primary-500 to-primary-600 transition-all duration-2000"
                style={{
                  width: `${(activeSectionIndex * 100) / (sections.length - 1)}%`,
                }}
              />

              {/* Section Navigation */}
              <div className="mb-6 flex items-center justify-between border-gray-300 border-b py-1">
                <div className="flex items-center gap-2">
                  <TemplateSelector
                    selectedTemplate={resumeData?.template as TemplateType}
                    onChange={(template) => setResumeData((prev) => ({ ...prev, template }))}
                  />
                  <ColorPicker
                    selectedColor={resumeData?.accent_color}
                    onChange={(color) => setResumeData((prev) => ({ ...prev, accent_color: color }))}
                  />
                </div>
                <div className="flex items-center">
                  {activeSectionIndex !== 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
                      }}
                      className="flex items-center gap-1 rounded-lg p-3 font-medium text-gray-600 text-sm transition-all hover:bg-gray-50"
                      disabled={activeSectionIndex === 0}
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSectionIndex((prevIndex) => Math.min(prevIndex + 1, sections.length - 1));
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded-lg p-3 font-medium text-gray-600 text-sm transition-all hover:bg-gray-50",
                      activeSectionIndex === sections.length - 1 ? "cursor-not-allowed opacity-50" : "",
                    )}
                    disabled={activeSectionIndex === sections.length - 1}
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {activeSection?.id === "personal" && (
                  <PersonalInfoForm
                    data={resumeData?.personal_info}
                    onChangeAction={updateResumeData}
                    removeBackground={removeBackground}
                    setRemoveBackgroundAction={setRemoveBackground}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-7 max-lg:mt-6">
            <div className="">{/* buttons */}</div>

            {/* resume preview */}
            {resumeData && (
              <ResumePreview
                data={resumeData}
                accentColor={resumeData.accent_color ?? ""}
                template={resumeData?.template as TemplateType}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
