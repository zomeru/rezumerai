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
import { Activity as ReactActivity, useEffect, useMemo, useState } from "react";
import {
  ColorPicker,
  EducationForm,
  ExperienceForm,
  PersonalInfoForm,
  ProfessionalSummaryForm,
  ProjectForm,
  ResumePreview,
  TemplateSelector,
} from "@/components/ResumeBuilder";
import {
  defaultResume,
  dummyResumeData,
  type Education,
  type Experience,
  type Project,
  type Resume,
} from "@/constants/dummy";
import type { TemplateType } from "@/templates";

type SectionType = {
  id: "personal" | "summary" | "experience" | "education" | "projects" | "skills";
  name: string;
  icon: typeof ArrowLeftIcon;
};

const sections: SectionType[] = [
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

  const [resumeData, setResumeData] = useState<Resume>(defaultResume);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);

  useEffect(() => {
    const resume = dummyResumeData.find((r) => r._id === resumeId) || defaultResume;
    setResumeData(resume);
  }, [resumeId]);

  function updateResumeData(data: Resume["personalInfo"]) {
    setResumeData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        personalInfo: data,
      };
    });
  }

  function handleTemplateChange(template: TemplateType) {
    setResumeData((prev) => {
      return { ...prev, template };
    });
  }

  function handleColorChange(color: string) {
    setResumeData((prev) => {
      return { ...prev, accentColor: color };
    });
  }

  function handleSummaryChange(summary: string) {
    setResumeData((prev) => ({ ...prev, professionalSummary: summary }));
  }

  function handleExperienceChange(experience: Experience[]) {
    setResumeData((prev) => ({ ...prev, experience }));
  }

  function handleEducationChange(education: Education[]) {
    setResumeData((prev) => ({ ...prev, education }));
  }

  function handleProjectChange(project: Project[]) {
    setResumeData((prev) => ({ ...prev, project }));
  }

  const builderSections = useMemo(() => {
    const _sections = [
      {
        id: "personal",
        render: () => (
          <PersonalInfoForm
            data={resumeData.personalInfo}
            onChangeAction={updateResumeData}
            removeBackground={removeBackground}
            setRemoveBackgroundAction={setRemoveBackground}
          />
        ),
      },
      {
        id: "summary",
        render: () => (
          <ProfessionalSummaryForm summary={resumeData.professionalSummary} onChange={handleSummaryChange} />
        ),
      },
      {
        id: "experience",
        render: () => <ExperienceForm experience={resumeData.experience} onChange={handleExperienceChange} />,
      },
      {
        id: "education",
        render: () => <EducationForm education={resumeData.education} onChange={handleEducationChange} />,
      },
      {
        id: "projects",
        render: () => <ProjectForm project={resumeData.project} onChange={handleProjectChange} />,
      },
      {
        id: "skills",
        render: () => <div>Skills form placeholder</div>, // TODO: Implement SkillsForm
      },
    ] as const;

    return _sections;
  }, [resumeData]);

  const activeSection = sections[activeSectionIndex];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <Link href="/app" className="hover:slate-700 inline-flex items-center gap-2 text-slate-500 transition-all">
          <ArrowLeftIcon className="size-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Panel - Form */}
          <div className="relative rounded-lg lg:col-span-5">
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
                    selectedTemplate={resumeData.template}
                    onChange={(template) => handleTemplateChange(template)}
                  />
                  <ColorPicker selectedColor={resumeData.accentColor} onChange={(color) => handleColorChange(color)} />
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
                {builderSections.map(({ id, render }) => (
                  <ReactActivity key={id} mode={activeSection?.id === id ? "visible" : "hidden"}>
                    {render()}
                  </ReactActivity>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="max-lg:mt-6 lg:col-span-7">
            <div className="">{/* buttons */}</div>

            {/* resume preview */}
            <ReactActivity mode={resumeData ? "visible" : "hidden"}>
              <ResumePreview data={resumeData} accentColor={resumeData.accentColor} template={resumeData.template} />
            </ReactActivity>
          </div>
        </div>
      </div>
    </div>
  );
}
