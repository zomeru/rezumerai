"use client";

import { cn } from "@rezumerai/utils/styles";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
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
  Share2Icon,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity as ReactActivity, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ColorPicker,
  EducationForm,
  ExperienceForm,
  type FontSizeOption,
  FontSizeSelector,
  PersonalInfoForm,
  ProfessionalSummaryForm,
  ProjectForm,
  ResumePreview,
  SkillsForm,
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

const FONT_SIZE_STORAGE_KEY = "rezumerai_font_size";

function getStoredFontSize(): FontSizeOption {
  if (typeof window === "undefined") return "medium";
  const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  if (stored === "small" || stored === "medium" || stored === "large") {
    return stored;
  }
  return "medium";
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
  const [isExporting, setIsExporting] = useState(false);

  // Load font size from localStorage on mount
  useEffect(() => {
    setFontSize(getStoredFontSize());
  }, []);

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

  function handleShareResume() {
    const currentUrl = window.location.href.split("/app/")[0];
    const resumeUrl = `${currentUrl}/view/${resumeData._id}`;

    navigator.share({
      title: "Check out my resume",
      text: "Here's a link to my resume:",
      url: resumeUrl,
    });
  }

  const downloadResume = useCallback(async () => {
    if (!resumePreviewRef.current || isExporting) return;

    setIsExporting(true);

    try {
      const element = resumePreviewRef.current;

      // Create canvas from the resume preview
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Calculate dimensions for letter size (8.5 x 11 inches)
      const imgWidth = 8.5;
      const imgHeight = 11;
      const pageWidth = imgWidth * 72; // 72 DPI
      const pageHeight = imgHeight * 72;

      // Create PDF with letter size
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter",
      });

      // Calculate scaling to fit content to page
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = Math.min(pageWidth / canvasWidth, pageHeight / canvasHeight);

      const scaledWidth = canvasWidth * ratio;
      const scaledHeight = canvasHeight * ratio;

      // Center the content on the page
      const xOffset = (pageWidth - scaledWidth) / 2;
      const yOffset = 0;

      // Add the image to PDF
      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight);

      // Generate filename
      const fileName = resumeData.personalInfo.fullName
        ? `Resume_${resumeData.personalInfo.fullName.replace(/\s+/g, "_")}.pdf`
        : "Resume.pdf";

      // Download the PDF
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  }, [resumeData.personalInfo.fullName, isExporting]);

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
        render: () => <SkillsForm skills={resumeData.skills} onChange={handleSkillsChange} />,
      },
    ] as const;

    return _sections;
  }, [resumeData, removeBackground]);

  const activeSection = sections[activeSectionIndex];
  const progressPercentage = (activeSectionIndex / (sections.length - 1)) * 100;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      {/* Header */}
      <div className="border-slate-200 border-b bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeftIcon className="size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Panel - Form */}
          <div className="relative lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Progress bar */}
              <div className="h-1 w-full bg-slate-100">
                <div
                  className="h-full bg-linear-to-r from-primary-500 to-primary-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="p-6">
                {/* Section Navigation */}
                <div className="mb-6 flex items-center justify-between border-slate-200 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <TemplateSelector
                      selectedTemplate={resumeData.template}
                      onChange={(template) => handleTemplateChange(template)}
                    />
                    <ColorPicker
                      selectedColor={resumeData.accentColor}
                      onChange={(color) => handleColorChange(color)}
                    />
                    <FontSizeSelector selectedSize={fontSize} onChange={handleFontSizeChange} />
                  </div>
                  <div className="flex items-center">
                    {activeSectionIndex !== 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
                        }}
                        className="flex items-center gap-1 rounded-lg p-2 font-medium text-slate-600 text-sm transition-colors hover:bg-slate-100"
                        disabled={activeSectionIndex === 0}
                      >
                        <ChevronLeft className="size-4" /> <span className="max-sm:hidden">Previous</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionIndex((prevIndex) => Math.min(prevIndex + 1, sections.length - 1));
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-lg p-2 font-medium text-slate-600 text-sm transition-colors hover:bg-slate-100",
                        activeSectionIndex === sections.length - 1 && "cursor-not-allowed opacity-50",
                      )}
                      disabled={activeSectionIndex === sections.length - 1}
                    >
                      <span className="max-sm:hidden">Next</span> <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Section Steps Indicator */}
                <div className="mb-6 flex items-center justify-center gap-1">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionIndex(index)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs transition-all",
                        index === activeSectionIndex
                          ? "bg-primary-500 font-semibold text-white"
                          : index < activeSectionIndex
                            ? "bg-primary-100 text-primary-600"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                      )}
                      title={section.name}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {/* Form Content */}
                <div className="min-h-100 space-y-6">
                  {builderSections.map(({ id, render }) => (
                    <ReactActivity key={id} mode={activeSection?.id === id ? "visible" : "hidden"}>
                      {render()}
                    </ReactActivity>
                  ))}
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  className="mt-6 w-full rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-6 py-3 font-medium text-white transition-all hover:from-primary-600 hover:to-primary-700 active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-7">
            <div className="sticky top-6">
              {/* Action Buttons */}
              <div className="mb-4 flex items-center justify-end gap-2">
                {resumeData.public && (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-secondary-100 px-4 py-2 font-medium text-secondary-700 text-sm transition-all hover:bg-secondary-200 active:scale-[0.98]"
                    onClick={handleShareResume}
                  >
                    <Share2Icon className="size-4" /> Share
                  </button>
                )}
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-accent-100 px-4 py-2 font-medium text-accent-700 text-sm transition-all hover:bg-accent-200 active:scale-[0.98]"
                  onClick={changeResumeVisibility}
                >
                  {resumeData.public ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                  {resumeData.public ? "Public" : "Private"}
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-5 py-2 font-medium text-sm text-white transition-all hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* Resume Preview */}
              <ReactActivity mode={resumeData ? "visible" : "hidden"}>
                <ResumePreview
                  ref={resumePreviewRef}
                  data={resumeData}
                  accentColor={resumeData.accentColor}
                  template={resumeData.template}
                  fontSize={fontSize}
                />
              </ReactActivity>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
