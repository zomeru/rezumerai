// Resume builder client component with React Query for mutations
"use client";

import type { ResumeWithRelations } from "@rezumerai/types";
import { ResumeUpdateBodySchema } from "@rezumerai/types";
import { cn } from "@rezumerai/utils/styles";
import { useQueryClient } from "@tanstack/react-query";
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
import dynamic from "next/dynamic";
import Link from "next/link";
import { Activity as ReactActivity, useEffect, useMemo, useRef, useState } from "react";
import {
  ColorPickerModal,
  EducationFormEnhanced,
  ExperienceFormEnhanced,
  FontSizeSelector,
  type FontSizeValue,
  PersonalInfoForm,
  ProfessionalSummaryFormEnhanced,
  ProjectFormEnhanced,
  ResumePreview,
  SkillsFormEnhanced,
  TemplateSelector,
} from "@/components/ResumeBuilder";
import { ROUTES } from "@/constants/routing";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { useResumeById, useUpdateResume } from "@/hooks/useResume";
import { useBuilderStore } from "@/store/useBuilderStore";
import type { TemplateType } from "@/templates";

const PDFPreview = dynamic(() => import("@/components/ResumeBuilder/PDFPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary-500" />
    </div>
  ),
});

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

interface ResumeBuilderClientProps {
  serverResume: ResumeWithRelations;
  resumeId: string;
}

export default function ResumeBuilderClient({ serverResume, resumeId }: ResumeBuilderClientProps) {
  const resumePreviewRef = useRef<HTMLDivElement>(null);

  // React Query for keeping server data fresh - uses server data as initial data to prevent hydration mismatch
  const { data: freshResume } = useResumeById(resumeId, {
    initialData: serverResume,
  });

  // Local draft state - initialized from server data, separate from React Query cache
  const [draftResume, setDraftResume] = useState<ResumeWithRelations>(serverResume);

  // Sync with fresh server data if available
  useEffect(() => {
    if (freshResume) {
      setDraftResume(freshResume);
    }
  }, [freshResume]);

  // Use React Query mutation for saving
  const updateResumeMutation = useUpdateResume();
  const queryClient = useQueryClient();

  // Builder UI store
  const activeSectionIndex = useBuilderStore((state) => state.activeSectionIndex);
  const setActiveSectionIndex = useBuilderStore((state) => state.setActiveSectionIndex);
  const removeBackground = useBuilderStore((state) => state.removeBackground);
  const setRemoveBackground = useBuilderStore((state) => state.setRemoveBackground);
  const isSaving = useBuilderStore((state) => state.isSaving);
  const setIsSaving = useBuilderStore((state) => state.setIsSaving);
  const lastSaved = useBuilderStore((state) => state.lastSaved);
  const setLastSaved = useBuilderStore((state) => state.setLastSaved);
  const previewMode = useBuilderStore((state) => state.previewMode);
  const setPreviewMode = useBuilderStore((state) => state.setPreviewMode);

  const resumeData = draftResume;

  const effectiveFontSize: FontSizeValue =
    resumeData.fontSize === "custom" ? (resumeData.customFontSize ?? 1) : resumeData.fontSize;

  // PDF generation hook
  const { pdfBlob, isGeneratingPdf, isExporting, downloadResume } = usePdfGenerator({
    resumeData,
    previewMode,
    resumePreviewRef,
    fontSize: effectiveFontSize,
    accentColor: resumeData.accentColor,
  });

  // Immutable update helper for draft state
  function updateDraft(updates: Partial<ResumeWithRelations>): void {
    setDraftResume((prev) => ({ ...prev, ...updates }));
  }

  function updateResumeData(data: NonNullable<ResumeWithRelations["personalInfo"]>) {
    updateDraft({ personalInfo: data });
  }

  function handleTemplateChange(template: TemplateType) {
    updateDraft({ template });
  }

  function handleColorChange(color: string) {
    updateDraft({ accentColor: color });
  }

  function handleFontSizeChange(size: FontSizeValue) {
    if (typeof size === "number") {
      updateDraft({ fontSize: "custom", customFontSize: size });
    } else if (size !== "custom") {
      updateDraft({ fontSize: size, customFontSize: 1 });
    } else {
      updateDraft({ fontSize: "custom" });
    }
  }

  function handleSummaryChange(summary: string) {
    updateDraft({ professionalSummary: summary });
  }

  function handleExperienceChange(experience: ResumeWithRelations["experience"]) {
    updateDraft({ experience });
  }

  function handleEducationChange(education: ResumeWithRelations["education"]) {
    updateDraft({ education });
  }

  function handleProjectChange(project: ResumeWithRelations["project"]) {
    updateDraft({ project });
  }

  function handleSkillsChange(skills: string[]) {
    updateDraft({ skills });
  }

  function changeResumeVisibility() {
    updateDraft({ public: !resumeData.public });
  }

  async function handleSaveResume(): Promise<void> {
    setIsSaving(true);
    try {
      const updates = {
        title: resumeData.title,
        public: resumeData.public,
        professionalSummary: resumeData.professionalSummary,
        template: resumeData.template,
        accentColor: resumeData.accentColor,
        fontSize: resumeData.fontSize,
        customFontSize: resumeData.customFontSize,
        skills: resumeData.skills,
        personalInfo: resumeData.personalInfo ?? undefined,
        experience: resumeData.experience,
        education: resumeData.education,
        project: resumeData.project,
      };

      // Validate update payload with Zod
      const validationResult = ResumeUpdateBodySchema.safeParse(updates);
      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error.flatten());
        throw new Error("Invalid resume data");
      }

      await updateResumeMutation.mutateAsync({ id: resumeId, updates: validationResult.data });
      setLastSaved(new Date());
      // Invalidate and refetch to ensure server data wins
      await queryClient.invalidateQueries({ queryKey: ["resumesById", resumeId] });
    } catch (error) {
      console.error("Failed to save resume:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShareResume(): Promise<void> {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const resumeUrl = `${baseUrl}${ROUTES.PREVIEW}/${resumeData.id}`;

    try {
      await navigator.share({
        title: "Check out my resume",
        text: "Here's a link to my resume:",
        url: resumeUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.debug("Share cancelled or failed:", error);
      }
    }
  }

  const builderSections = useMemo(() => {
    const _sections = [
      {
        id: "personal",
        render: () => (
          <PersonalInfoForm
            data={
              resumeData.personalInfo ??
              ({
                id: "",
                resumeId: "",
                fullName: "",
                email: "",
                phone: "",
                location: "",
                linkedin: "",
                website: "",
                profession: "",
                image: "",
              } as NonNullable<ResumeWithRelations["personalInfo"]>)
            }
            onChangeAction={updateResumeData}
            removeBackground={removeBackground}
            setRemoveBackgroundAction={setRemoveBackground}
          />
        ),
      },
      {
        id: "summary",
        render: () => (
          <ProfessionalSummaryFormEnhanced
            summary={resumeData.professionalSummary ?? ""}
            onChange={handleSummaryChange}
          />
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
    <main className="flex min-h-screen flex-1 flex-col bg-linear-to-br from-slate-50 to-slate-100">
      {/* Redesigned Header */}
      <div className="border-slate-200/60 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-400 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href={ROUTES.WORKSPACE}
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

      {/* Main Content */}
      <div className="mx-auto w-full max-w-400 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12">
          {/* Left Panel - Editor */}
          <div className="w-full lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              {/* Controls Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                <div className="border-slate-100 border-b bg-linear-to-br from-slate-50 to-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <TemplateSelector
                        selectedTemplate={resumeData.template}
                        onChange={(template: TemplateType) => handleTemplateChange(template)}
                      />
                      <ColorPickerModal
                        selectedColor={resumeData.accentColor}
                        onChange={(color: string) => handleColorChange(color)}
                      />
                      <FontSizeSelector selectedSize={effectiveFontSize} onChange={handleFontSizeChange} />
                    </div>
                    <div className="flex items-center gap-2">
                      {activeSectionIndex !== 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionIndex(Math.max(activeSectionIndex - 1, 0));
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
                            setActiveSectionIndex(Math.min(activeSectionIndex + 1, sections.length - 1));
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
                    className="h-full bg-linear-to-r from-primary-500 to-primary-600 transition-all duration-500"
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
                          ? "scale-110 bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-6 py-4 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary-500 to-primary-600 px-5 py-2.5 font-semibold text-sm text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-primary-500/40 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* Resume Preview */}
              <ReactActivity mode="visible">
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
                    fontSize={effectiveFontSize}
                    previewMode={previewMode}
                  />
                </div>
                {previewMode === "pdf" && <PDFPreview pdfBlob={pdfBlob} isGenerating={isGeneratingPdf} />}
              </ReactActivity>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
