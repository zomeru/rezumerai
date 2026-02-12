"use client";

import RichTextEditor from "./RichTextEditor";

/**
 * Props for the ProfessionalSummaryFormEnhanced component.
 *
 * @property summary - Current professional summary HTML content
 * @property onChange - Callback with updated summary HTML
 */
export interface ProfessionalSummaryFormEnhancedProps {
  summary: string;
  onChange: (summary: string) => void;
}

/**
 * Professional summary form section with rich text editing.
 * Provides a TipTap editor for composing the resume's professional summary
 * with formatting support and a helpful tip.
 *
 * @param props - Form configuration with summary data and change handler
 * @returns Professional summary form with rich text editor
 */

export default function ProfessionalSummaryFormEnhanced({
  summary,
  onChange,
}: ProfessionalSummaryFormEnhancedProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1.5 font-semibold text-lg text-slate-900">Professional Summary</h3>
        <p className="text-slate-600 text-sm">
          Write a brief overview of your professional background, key skills, and career objectives.
        </p>
      </div>

      <RichTextEditor
        content={summary}
        onChange={onChange}
        placeholder="e.g. Experienced software engineer with 5+ years of expertise in full-stack development..."
      />

      <p className="text-slate-500 text-xs">Tip: Keep it concise (3-5 sentences) and highlight your unique value.</p>
    </div>
  );
}
