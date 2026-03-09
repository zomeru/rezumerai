"use client";

import type { ResumeWithRelations } from "@rezumerai/types";
import { cn } from "@rezumerai/utils/styles";
import {
  ArrowLeftIcon,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2,
  SaveIcon,
  Share2Icon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Activity as ReactActivity, useMemo, useRef } from "react";
import {
  ColorPickerModal,
  EducationFormEnhanced,
  ExperienceFormEnhanced,
  FontSizeSelector,
  PersonalInfoForm,
  ProfessionalSummaryFormEnhanced,
  ProjectFormEnhanced,
  ResumeCopilotPanel,
  ResumePreview,
  SkillsFormEnhanced,
  TemplateSelector,
} from "@/components/ResumeBuilder";
import { ROUTES } from "@/constants/routing";
import { RESUME_BUILDER_SECTIONS } from "./constants";
import { useResumeBuilderController } from "./hooks/useResumeBuilderController";

const PDFPreview = dynamic(() => import("@/components/ResumeBuilder/PDFPreview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary-500" />
    </div>
  ),
});

interface ResumeBuilderClientProps {
  serverResume: ResumeWithRelations;
  resumeId: string;
}

const EMPTY_PERSONAL_INFO: NonNullable<ResumeWithRelations["personalInfo"]> = {
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
};

export default function ResumeBuilderClient({ serverResume, resumeId }: ResumeBuilderClientProps) {
  const resumePreviewRef = useRef<HTMLDivElement>(null);
  const {
    activeSectionIndex,
    applyCopilotPatch,
    changeResumeVisibility,
    draftResume,
    downloadResume,
    educationErrors,
    effectiveFontSize,
    handleColorChange,
    handleEducationChange,
    handleExperienceChange,
    handleFontSizeChange,
    handleProjectChange,
    handleSaveResume,
    handleShareResume,
    handleSkillsChange,
    handleSummaryChange,
    handleTemplateChange,
    invalidExperienceIndices,
    isExporting,
    isGeneratingPdf,
    isSaving,
    lastSaved,
    pdfBlob,
    personalInfoErrors,
    previewMode,
    projectErrors,
    removeBackground,
    setActiveSectionIndex,
    setPreviewMode,
    setRemoveBackground,
    updateResumeData,
  } = useResumeBuilderController({
    serverResume,
    resumeId,
    resumePreviewRef,
  });

  const builderSections = useMemo(
    () =>
      [
        {
          id: "personal",
          render: () => (
            <PersonalInfoForm
              data={draftResume.personalInfo ?? EMPTY_PERSONAL_INFO}
              onChangeAction={updateResumeData}
              removeBackground={removeBackground}
              setRemoveBackgroundAction={setRemoveBackground}
              errors={personalInfoErrors}
            />
          ),
        },
        {
          id: "summary",
          render: () => (
            <ProfessionalSummaryFormEnhanced
              summary={draftResume.professionalSummary ?? ""}
              onChange={handleSummaryChange}
            />
          ),
        },
        {
          id: "experience",
          render: () => (
            <ExperienceFormEnhanced
              experience={draftResume.experience}
              onChange={handleExperienceChange}
              invalidIndices={invalidExperienceIndices}
            />
          ),
        },
        {
          id: "education",
          render: () => (
            <EducationFormEnhanced
              education={draftResume.education}
              onChange={handleEducationChange}
              errors={educationErrors}
            />
          ),
        },
        {
          id: "projects",
          render: () => (
            <ProjectFormEnhanced project={draftResume.project} onChange={handleProjectChange} errors={projectErrors} />
          ),
        },
        {
          id: "skills",
          render: () => <SkillsFormEnhanced skills={draftResume.skills} onChange={handleSkillsChange} />,
        },
      ] as const,
    [
      draftResume,
      educationErrors,
      handleEducationChange,
      handleExperienceChange,
      handleProjectChange,
      handleSkillsChange,
      handleSummaryChange,
      invalidExperienceIndices,
      personalInfoErrors,
      projectErrors,
      removeBackground,
      setRemoveBackground,
      updateResumeData,
    ],
  );

  const activeSection = RESUME_BUILDER_SECTIONS[activeSectionIndex];
  const progressPercentage = (activeSectionIndex / (RESUME_BUILDER_SECTIONS.length - 1)) * 100;

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-linear-to-br from-slate-50 to-slate-100">
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

      <div className="mx-auto w-full max-w-400 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12">
          <div className="w-full lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                <div className="border-slate-100 border-b bg-linear-to-br from-slate-50 to-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <TemplateSelector selectedTemplate={draftResume.template} onChange={handleTemplateChange} />
                      <ColorPickerModal selectedColor={draftResume.accentColor} onChange={handleColorChange} />
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
                      {activeSectionIndex < RESUME_BUILDER_SECTIONS.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSectionIndex(Math.min(activeSectionIndex + 1, RESUME_BUILDER_SECTIONS.length - 1));
                          }}
                          className="flex items-center gap-1 rounded-lg bg-slate-100 p-2 font-medium text-slate-700 text-sm transition-all hover:bg-slate-200 active:scale-95"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100">
                  <div
                    className="h-full bg-linear-to-r from-primary-500 to-primary-600 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 border-slate-100 border-b p-4">
                  {RESUME_BUILDER_SECTIONS.map((section, index) => (
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

              <ResumeCopilotPanel resumeId={resumeId} resume={draftResume} onApplyPatch={applyCopilotPatch} />
            </div>
          </div>

          <div className="w-full lg:col-span-7">
            <div className="sticky top-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                  {draftResume.public && (
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
                    {draftResume.public ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                    {draftResume.public ? "Public" : "Private"}
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
                    data={draftResume}
                    accentColor={draftResume.accentColor}
                    template={draftResume.template}
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
