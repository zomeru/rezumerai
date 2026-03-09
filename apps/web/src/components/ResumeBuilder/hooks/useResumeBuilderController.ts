"use client";

import type { ResumeWithRelations, ResumeWithRelationsInputUpdate } from "@rezumerai/types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routing";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { useResumeById, useUpdateResume } from "@/hooks/useResume";
import { ResumeDraftValidator } from "@/lib/validation/resume-draft";
import { useBuilderStore } from "@/store/useBuilderStore";
import type { TemplateType } from "@/templates";
import type { FontSizeValue } from "../FontSizeSelector";
import { mergeCopilotPatch } from "../utils/mergeCopilotPatch";

interface UseResumeBuilderControllerOptions {
  serverResume: ResumeWithRelations;
  resumeId: string;
  resumePreviewRef: React.RefObject<HTMLDivElement | null>;
}

export function useResumeBuilderController({
  serverResume,
  resumeId,
  resumePreviewRef,
}: UseResumeBuilderControllerOptions) {
  const { data: freshResume } = useResumeById(resumeId, {
    initialData: serverResume,
  });

  const storedDraftResume = useBuilderStore((state) => state.draftResume);
  const setDraftResume = useBuilderStore((state) => state.setDraftResume);
  const updateDraftResume = useBuilderStore((state) => state.updateDraftResume);
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
  const draftResume = storedDraftResume ?? serverResume;

  useEffect(() => {
    setDraftResume(freshResume ?? serverResume);
  }, [freshResume, serverResume, setDraftResume]);

  const updateResumeMutation = useUpdateResume();

  const [invalidExperienceIndices, setInvalidExperienceIndices] = useState<Set<number>>(new Set());
  const [personalInfoErrors, setPersonalInfoErrors] = useState<Record<string, string>>({});
  const [projectErrors, setProjectErrors] = useState<Record<number, Record<string, string>>>({});
  const [educationErrors, setEducationErrors] = useState<Record<number, Record<string, string>>>({});

  const validator = useMemo(
    () =>
      new ResumeDraftValidator({
        setPersonalInfoErrors,
        setInvalidExperienceIndices,
        setProjectErrors,
        setEducationErrors,
      }),
    [],
  );

  const effectiveFontSize: FontSizeValue =
    draftResume.fontSize === "custom" ? (draftResume.customFontSize ?? 1) : draftResume.fontSize;

  const { pdfBlob, isGeneratingPdf, isExporting, downloadResume } = usePdfGenerator({
    resumeData: draftResume,
    previewMode,
    resumePreviewRef,
    fontSize: effectiveFontSize,
    accentColor: draftResume.accentColor,
  });

  function updateDraft(updates: Partial<ResumeWithRelations>): void {
    updateDraftResume(updates);
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
      return;
    }

    if (size !== "custom") {
      updateDraft({ fontSize: size, customFontSize: 1 });
      return;
    }

    updateDraft({ fontSize: "custom" });
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
    updateDraft({ public: !draftResume.public });
  }

  function applyCopilotPatch(patch: unknown): void {
    const nextResume = mergeCopilotPatch(draftResume, patch);

    if (nextResume !== draftResume) {
      setDraftResume(nextResume);
    }
  }

  async function handleSaveResume(): Promise<void> {
    const isValid = validator.validateAll(draftResume);

    if (!isValid) {
      return;
    }

    const resumeDataToSave: ResumeWithRelationsInputUpdate = {
      ...draftResume,
      personalInfo: draftResume.personalInfo ?? undefined,
    };

    setIsSaving(true);

    try {
      await updateResumeMutation.mutateAsync({ id: resumeId, updates: resumeDataToSave });
      setLastSaved(new Date());
    } catch (error) {
      const errorMessage =
        typeof error === "string" ? error : error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShareResume(): Promise<void> {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const resumeUrl = `${baseUrl}${ROUTES.PREVIEW}/${draftResume.id}`;

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

  return {
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
  };
}
