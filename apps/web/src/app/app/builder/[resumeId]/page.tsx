"use client";

import { cn } from "@rezumerai/utils/styles";
import {
  ArrowLeftIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  FileText,
  FolderIcon,
  GraduationCap,
  Loader2,
  SaveIcon,
  Share2Icon,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity as ReactActivity, useEffect, useMemo, useRef, useState } from "react";
import {
  ColorPickerModal,
  EducationFormEnhanced,
  ExperienceFormEnhanced,
  type FontSizeOption,
  FontSizeSelector,
  PDFPreview,
  PersonalInfoForm,
  ProfessionalSummaryFormEnhanced,
  ProjectFormEnhanced,
  ResumePreview,
  SkillsFormEnhanced,
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
import { type PreviewMode, usePdfGenerator } from "@/hooks/usePdfGenerator";
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

const FONT_SIZE_STORAGE_KEY = "rezumerai_font_size";
const AUTO_SAVE_KEY = "rezumerai_autosave";
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

function getStoredFontSize(): FontSizeOption {
  if (typeof window === "undefined") return "medium";
  const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  if (stored === "small" || stored === "medium" || stored === "large") {
    return stored;
  }
  return "medium";
}

function saveToLocalStorage(resumeId: string, data: Resume) {
  if (typeof window === "undefined") return;
  try {
    const storageData = {
      resumeId,
      data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`${AUTO_SAVE_KEY}_${resumeId}`, JSON.stringify(storageData));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

function loadFromLocalStorage(resumeId: string): Resume | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${AUTO_SAVE_KEY}_${resumeId}`);
    if (stored) {
      const { data } = JSON.parse(stored);
      return data;
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
  }
  return null;
}

export default function ResumeBuilder() {
  const { resumeId } = useParams<{
    resumeId: string;
  }>();

  const resumePreviewRef = useRef<HTMLDivElement>(null);
  const [resumeData, setResumeData] = useState<Resume>(defaultResume);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeOption>("medium");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("html");

  // PDF generation hook
  const { pdfBlob, isGeneratingPdf, isExporting, downloadResume } = usePdfGenerator({
    resumeData,
    previewMode,
    resumePreviewRef,
  });

  // Load font size from localStorage on mount
  useEffect(() => {
    setFontSize(getStoredFontSize());
  }, []);

  // Load resume data (check localStorage first, then dummy data)
  useEffect(() => {
    const savedData = loadFromLocalStorage(resumeId);
    if (savedData) {
      setResumeData(savedData);
    } else {
      const resume = dummyResumeData.find((r) => r._id === resumeId) || defaultResume;
      setResumeData(resume);
    }
  }, [resumeId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!resumeData._id) return;

    const intervalId = setInterval(() => {
      saveToLocalStorage(resumeId, resumeData);
      setLastSaved(new Date());
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [resumeId, resumeData]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (resumeData._id) {
        saveToLocalStorage(resumeId, resumeData);
      }
    };
  }, [resumeId, resumeData]);

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

  function handleFontSizeChange(size: FontSizeOption) {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
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

  function handleSkillsChange(skills: string[]) {
    setResumeData((prev) => ({ ...prev, skills }));
  }

  async function changeResumeVisibility() {
    setResumeData((prev) => ({ ...prev, public: !prev.public }));
  }

  async function handleSaveResume() {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      saveToLocalStorage(resumeId, resumeData);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save resume:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShareResume() {
    const currentUrl = window.location.href.split("/app/")[0];
    const resumeUrl = `${currentUrl}/view/${resumeData._id}`;

    try {
      await navigator.share({
        title: "Check out my resume",
        text: "Here's a link to my resume:",
        url: resumeUrl,
      });
    } catch (error) {
      // Silently handle cancellation or errors
      // AbortError is thrown when user cancels the share dialog
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing resume:", error);
      }
    }
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
          <ProfessionalSummaryFormEnhanced summary={resumeData.professionalSummary} onChange={handleSummaryChange} />
        ),
      },
      {
        id: "experience",
        render: () => <ExperienceFormEnhanced experience={resumeData.experience} onChange={handleExperienceChange} />,
      },
      {
        id: "education",
        render: () => <EducationFormEnhanced education={resumeData.education} onChange={handleEducationChange} />,
      },
      {
        id: "projects",
        render: () => <ProjectFormEnhanced project={resumeData.project} onChange={handleProjectChange} />,
      },
      {
        id: "skills",
        render: () => <SkillsFormEnhanced skills={resumeData.skills} onChange={handleSkillsChange} />,
      },
    ] as const;

    return _sections;
  }, [resumeData, removeBackground]);

  const activeSection = sections[activeSectionIndex];
  const progressPercentage = (activeSectionIndex / (sections.length - 1)) * 100;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Redesigned Header */}
      <div className="border-slate-200/60 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-3">
              {lastSaved && <span className="text-slate-500 text-xs">Saved {lastSaved.toLocaleTimeString()}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Completely Redesigned */}
      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12">
          {/* Left Panel - Editor */}
          <div className="w-full lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              {/* Controls Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                <div className="border-slate-100 border-b bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <TemplateSelector
                        selectedTemplate={resumeData.template}
                        onChange={(template) => handleTemplateChange(template)}
                      />
                      <ColorPickerModal
                        selectedColor={resumeData.accentColor}
                        onChange={(color) => handleColorChange(color)}
                      />
                      <FontSizeSelector selectedSize={fontSize} onChange={handleFontSizeChange} />
                    </div>
                    <div className="flex items-center gap-2">
                      {activeSectionIndex !== 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
                          }}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 p-2 font-medium text-slate-700 text-sm transition-all hover:bg-slate-200 active:scale-95"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                      )}
                      {activeSectionIndex < sections.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionIndex((prevIndex) => Math.min(prevIndex + 1, sections.length - 1));
                          }}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 p-2 font-medium text-slate-700 text-sm transition-all hover:bg-slate-200 active:scale-95"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                {/* Section Steps */}
                <div className="flex items-center justify-center gap-2 border-slate-100 border-b p-4">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionIndex(index)}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl font-semibold text-sm transition-all",
                        index === activeSectionIndex
                          ? "scale-110 bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30"
                          : index < activeSectionIndex
                            ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                      )}
                      title={section.name}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Form Content */}
                <div className="max-w-full overflow-hidden p-6">
                  <div className="mb-4">
                    <h2 className="font-semibold text-slate-900 text-xl">{activeSection?.name}</h2>
                    <p className="text-slate-600 text-sm">Complete this section to build your resume</p>
                  </div>

                  <div className="space-y-6">
                    {builderSections.map(({ id, render }) => (
                      <ReactActivity key={id} mode={activeSection?.id === id ? "visible" : "hidden"}>
                        {render()}
                      </ReactActivity>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveResume}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-full lg:col-span-7">
            <div className="sticky top-8 space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Preview Mode Toggle */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("html")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 font-medium text-sm transition-all",
                      previewMode === "html"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    Design
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("pdf")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 font-medium text-sm transition-all",
                      previewMode === "pdf"
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    PDF Preview
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {resumeData.public && (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-4 py-2.5 font-medium text-secondary-700 text-sm shadow-sm transition-all hover:bg-secondary-50 hover:shadow active:scale-95"
                      onClick={handleShareResume}
                    >
                      <Share2Icon className="size-4" /> Share
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-accent-200 bg-white px-4 py-2.5 font-medium text-accent-700 text-sm shadow-sm transition-all hover:bg-accent-50 hover:shadow active:scale-95"
                    onClick={changeResumeVisibility}
                  >
                    {resumeData.public ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                    {resumeData.public ? "Public" : "Private"}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 font-semibold text-sm text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={downloadResume}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="size-4" /> Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resume Preview with modern styling */}
              <ReactActivity mode={resumeData ? "visible" : "hidden"}>
                {/* Keep HTML preview always mounted for PDF generation */}
                <div
                  className={cn(
                    "overflow-auto rounded-2xl border border-slate-200/60 bg-white shadow-xl",
                    previewMode === "pdf" && "pointer-events-none absolute opacity-0",
                  )}
                  aria-hidden={previewMode === "pdf"}
                >
                  <ResumePreview
                    ref={resumePreviewRef}
                    data={resumeData}
                    accentColor={resumeData.accentColor}
                    template={resumeData.template}
                    fontSize={fontSize}
                    previewMode={previewMode}
                  />
                </div>
                {/* PDF Preview */}
                {previewMode === "pdf" && <PDFPreview pdfBlob={pdfBlob} isGenerating={isGeneratingPdf} />}
              </ReactActivity>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
