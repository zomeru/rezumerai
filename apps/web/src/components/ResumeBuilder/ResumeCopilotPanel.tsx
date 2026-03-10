"use client";

import type { ResumeSectionTarget, ResumeWithRelations } from "@rezumerai/types";
import { Bot, Loader2, Sparkles, Target as TargetIcon, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ERROR_MESSAGES } from "@/constants/errors";
import { useAccountSettings } from "@/hooks/useAccount";
import { useCopilotOptimizeSection, useCopilotReviewResume, useCopilotTailorResume } from "@/hooks/useAi";
import { getAiFeatureAccessMessage } from "@/lib/ai-access";
import { isAnonymousSession, useSession } from "@/lib/auth-client";
import { DisabledTooltip } from "../ui/DisabledTooltip";

type CopilotMode = "optimize" | "tailor" | "review";
const COPILOT_MODES: CopilotMode[] = ["optimize", "tailor", "review"];

function isCopilotIntent(value: string): value is "clarity" | "impact" | "ats" | "concise" | "grammar" {
  return ["clarity", "impact", "ats", "concise", "grammar"].includes(value);
}

interface ResumeCopilotPanelProps {
  resumeId: string;
  resume: ResumeWithRelations;
  onApplyPatch: (patch: unknown) => void;
}

interface SectionOption {
  value: string;
  label: string;
  target: ResumeSectionTarget;
}

function buildSectionOptions(resume: ResumeWithRelations): SectionOption[] {
  return [
    {
      value: "professionalSummary",
      label: "Professional Summary",
      target: { section: "professionalSummary" },
    },
    {
      value: "skills",
      label: "Skills",
      target: { section: "skills" },
    },
    ...resume.experience.map((item) => ({
      value: `experience:${item.id}`,
      label: `Experience: ${item.position || "Role"}${item.company ? ` @ ${item.company}` : ""}`,
      target: { section: "experience" as const, itemId: item.id },
    })),
    ...resume.education.map((item) => ({
      value: `education:${item.id}`,
      label: `Education: ${item.degree || "Degree"}${item.institution ? ` @ ${item.institution}` : ""}`,
      target: { section: "education" as const, itemId: item.id },
    })),
    ...resume.project.map((item) => ({
      value: `project:${item.id}`,
      label: `Project: ${item.name || "Project"}`,
      target: { section: "project" as const, itemId: item.id },
    })),
  ];
}

export default function ResumeCopilotPanel({
  resumeId,
  resume,
  onApplyPatch,
}: ResumeCopilotPanelProps): React.JSX.Element {
  const { data: session } = useSession();
  const isAnonymous = isAnonymousSession(session);
  const accountSettings = useAccountSettings({
    enabled: Boolean(session?.user?.id) && !isAnonymous,
    retry: false,
  });
  const optimizeMutation = useCopilotOptimizeSection();
  const tailorMutation = useCopilotTailorResume();
  const reviewMutation = useCopilotReviewResume();

  const [mode, setMode] = useState<CopilotMode>("optimize");
  const [intent, setIntent] = useState<"clarity" | "impact" | "ats" | "concise" | "grammar">("clarity");
  const [selectedTargetKey, setSelectedTargetKey] = useState("professionalSummary");
  const [jobDescription, setJobDescription] = useState("");

  const sectionOptions = useMemo(() => buildSectionOptions(resume), [resume]);
  const selectedTarget = sectionOptions.find((option) => option.value === selectedTargetKey)?.target ??
    sectionOptions[0]?.target ?? { section: "professionalSummary" };

  const isBusy = optimizeMutation.isPending || tailorMutation.isPending || reviewMutation.isPending;
  const trimmedJobDescription = jobDescription.trim();
  const aiAccessMessage = getAiFeatureAccessMessage({
    isAnonymous,
    emailVerified: accountSettings.data?.user.emailVerified,
  });
  const isAiRestricted = aiAccessMessage !== null;
  const tailorNeedsMoreDetail =
    mode === "tailor" && trimmedJobDescription.length > 0 && trimmedJobDescription.length < 20;
  const tailorValidationMessage =
    mode === "tailor" && trimmedJobDescription.length === 0
      ? "Paste a job description to tailor this resume."
      : tailorNeedsMoreDetail
        ? "Add a little more detail so the job description is at least 20 characters."
        : null;
  const actionDisabled =
    isBusy || isAiRestricted || (mode === "tailor" && (trimmedJobDescription.length === 0 || tailorNeedsMoreDetail));

  function applyPatch(patch: unknown): void {
    onApplyPatch(patch);
    toast.success("Suggestion applied to your draft.");
  }

  async function runOptimize(): Promise<void> {
    try {
      await optimizeMutation.mutateAsync({
        resumeId,
        target: selectedTarget,
        intent,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to optimize this section.");
    }
  }

  async function runTailor(): Promise<void> {
    if (trimmedJobDescription.length < 20) {
      toast.error("Add a job description with at least 20 characters.");
      return;
    }

    try {
      await tailorMutation.mutateAsync({
        resumeId,
        jobDescription: trimmedJobDescription,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to tailor this resume.");
    }
  }

  async function runReview(): Promise<void> {
    try {
      await reviewMutation.mutateAsync({
        resumeId,
        jobDescription: jobDescription.trim() || undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review this resume.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm">
      <div className="border-slate-100 border-b p-5">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary-600" />
          <div>
            <h2 className="font-semibold text-slate-900">Resume Copilot</h2>
            <p className="text-slate-600 text-sm">Optimize a section, tailor for a role, or review quality.</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {aiAccessMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
            {aiAccessMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {COPILOT_MODES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-xl px-3 py-2 font-medium text-sm transition ${
                mode === value ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {value === "optimize" ? "Optimize" : value === "tailor" ? "Tailor" : "Review"}
            </button>
          ))}
        </div>

        {mode === "optimize" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="copilot-target" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Section target
              </label>
              <select
                id="copilot-target"
                value={selectedTargetKey}
                onChange={(event) => setSelectedTargetKey(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                {sectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="copilot-intent" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Goal
              </label>
              <select
                id="copilot-intent"
                value={intent}
                onChange={(event) => {
                  if (isCopilotIntent(event.target.value)) {
                    setIntent(event.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="clarity">Clarity</option>
                <option value="impact">Impact</option>
                <option value="ats">ATS alignment</option>
                <option value="concise">Concise</option>
                <option value="grammar">Grammar</option>
              </select>
            </div>

            {aiAccessMessage ? (
              <DisabledTooltip message={aiAccessMessage} className="w-full">
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-sm text-white opacity-60"
                >
                  <Wand2 className="size-4" />
                  Optimize section
                </button>
              </DisabledTooltip>
            ) : (
              <button
                type="button"
                onClick={() => void runOptimize()}
                disabled={actionDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-sm text-white transition hover:bg-slate-900 disabled:opacity-60"
              >
                {optimizeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                Optimize section
              </button>
            )}

            {optimizeMutation.data && (
              <div className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{optimizeMutation.data.suggestion.title}</p>
                    <p className="mt-1 text-slate-600 text-sm">{optimizeMutation.data.suggestion.rationale}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600 text-xs">
                    {optimizeMutation.data.creditsRemaining} credits left
                  </span>
                </div>
                <div className="rounded-xl bg-white p-3 text-slate-700 text-sm">
                  {optimizeMutation.data.suggestion.suggestedText}
                </div>
                {optimizeMutation.data.suggestion.cautions.length > 0 && (
                  <ul className="space-y-1 text-amber-800 text-sm">
                    {optimizeMutation.data.suggestion.cautions.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => applyPatch(optimizeMutation.data?.suggestion.draftPatch)}
                  className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-sm text-white"
                >
                  Apply suggestion
                </button>
              </div>
            )}
          </div>
        )}

        {mode !== "optimize" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="copilot-job-description" className="mb-1.5 block font-medium text-slate-700 text-sm">
                Job description {mode === "review" ? "(optional)" : ""}
              </label>
              <textarea
                id="copilot-job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description here..."
                className="min-h-36 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
              />
            </div>

            {tailorValidationMessage && <p className="text-amber-700 text-xs">{tailorValidationMessage}</p>}

            {aiAccessMessage ? (
              <DisabledTooltip message={aiAccessMessage} className="w-full">
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-sm text-white opacity-60"
                >
                  {mode === "tailor" ? <TargetIcon className="size-4" /> : <Sparkles className="size-4" />}
                  {mode === "tailor" ? "Tailor resume" : "Review resume"}
                </button>
              </DisabledTooltip>
            ) : (
              <button
                type="button"
                onClick={() => void (mode === "tailor" ? runTailor() : runReview())}
                disabled={actionDisabled}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-sm text-white transition hover:bg-slate-900 disabled:opacity-60"
              >
                {(tailorMutation.isPending || reviewMutation.isPending) && <Loader2 className="size-4 animate-spin" />}
                {mode === "tailor" ? <TargetIcon className="size-4" /> : <Sparkles className="size-4" />}
                {mode === "tailor" ? "Tailor resume" : "Review resume"}
              </button>
            )}
          </div>
        )}

        {mode === "tailor" && tailorMutation.data && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{tailorMutation.data.jobTitle || "Tailoring summary"}</p>
                <p className="text-slate-600 text-sm">{tailorMutation.data.creditsRemaining} credits left</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white p-3">
                <p className="font-semibold text-slate-900 text-sm">Matches</p>
                <ul className="mt-2 space-y-1 text-slate-700 text-sm">
                  {tailorMutation.data.matches.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="font-semibold text-slate-900 text-sm">Gaps</p>
                <ul className="mt-2 space-y-1 text-slate-700 text-sm">
                  {tailorMutation.data.gaps.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              {tailorMutation.data.suggestions.map((item) => (
                <div
                  key={`${item.target.section}-${item.target.itemId ?? "all"}-${item.reason}`}
                  className="rounded-xl bg-white p-4"
                >
                  <p className="font-semibold text-slate-900 text-sm">{item.reason}</p>
                  <p className="mt-2 text-slate-700 text-sm">{item.suggestion}</p>
                  {item.cautions.length > 0 && (
                    <ul className="mt-2 space-y-1 text-amber-800 text-sm">
                      {item.cautions.map((caution) => (
                        <li key={caution}>- {caution}</li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => applyPatch(item.draftPatch)}
                    className="mt-3 rounded-xl bg-primary-600 px-4 py-2 font-semibold text-sm text-white"
                  >
                    Apply suggestion
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "review" && reviewMutation.data && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Resume review</p>
                <p className="text-slate-600 text-sm">{reviewMutation.data.summary}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center">
                <p className="font-semibold text-2xl text-slate-900">{reviewMutation.data.overallScore}</p>
                <p className="text-slate-500 text-xs">score</p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="font-semibold text-slate-900 text-sm">Strengths</p>
              <ul className="mt-2 space-y-1 text-slate-700 text-sm">
                {reviewMutation.data.strengths.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {reviewMutation.data.findings.map((finding) => (
                <div key={`${finding.section}-${finding.message}`} className="rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{finding.section}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 uppercase tracking-wide">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-700 text-sm">{finding.message}</p>
                  <p className="mt-2 text-slate-500 text-sm">Fix: {finding.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
