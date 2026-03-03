"use client";

import type { ResumeWithRelations } from "@rezumerai/types";
import { generateUuidKey } from "@rezumerai/utils";
import { formatDateRange } from "@rezumerai/utils/date";
import { cn } from "@rezumerai/utils/styles";
import { useEffect, useState } from "react";
import DatePicker from "./DatePicker";
import DraggableList from "./DraggableList";
import { DeleteButton, EmptyState, SectionHeader, TextInput } from "./Inputs";
import RichTextEditor from "./RichTextEditor";

type Experience = ResumeWithRelations["experience"];

/**
 * Props for the ExperienceFormEnhanced component.
 *
 * @property experience - Array of work experience entries
 * @property onChange - Callback with updated experience array
 * @property invalidIndices - Set of entry indices that failed end date validation; triggers auto-expand and inline error. Callers must pass a new Set reference on each validation cycle for the auto-expand effect to fire.
 */
export interface ExperienceFormEnhancedProps {
  experience: Experience;
  onChange: (experience: Experience) => void;
  invalidIndices?: Set<number>;
}

/**
 * Enhanced work experience form with drag-and-drop reordering.
 * Supports adding, removing, and editing experience entries with
 * accordion expand/collapse, date pickers, and rich text descriptions.
 *
 * @param props - Form configuration with experience data and change handler
 * @returns Experience form with DnD reordering and accordion entries
 */

export default function ExperienceFormEnhanced({ experience, onChange, invalidIndices }: ExperienceFormEnhancedProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!invalidIndices || invalidIndices.size === 0) return;
    const firstInvalid = [...invalidIndices].sort((a, b) => a - b)[0];
    if (firstInvalid !== undefined) setExpandedIndex(firstInvalid);
  }, [invalidIndices]);

  const handleAdd = () => {
    const newExperience: Experience[number] = {
      id: generateUuidKey(),
      resumeId: experience[0]?.resumeId || "",
      company: "",
      position: "",
      startDate: new Date(),
      endDate: null,
      description: "",
      isCurrent: false,
    };
    onChange([...experience, newExperience]);
    setExpandedIndex(experience.length);
  };

  const handleRemove = (index: number) => {
    const updated = experience.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Experience[number], value: string | boolean | Date | null) => {
    const updated = experience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Work Experience" onAdd={handleAdd} />

      <DraggableList
        items={experience}
        onReorder={onChange}
        getItemId={(item: Experience[number]): string => item.id}
        renderItem={(exp: Experience[number], index: number) => (
          <div className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {exp.position || "Position"} {exp.company && `at ${exp.company}`}
                </p>
                <p className="text-slate-500 text-sm">{formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}</p>
              </div>
              <DeleteButton onDelete={() => handleRemove(index)} ariaLabel={`Delete ${exp.position || "experience"}`} />
            </button>

            {expandedIndex === index && (
              <div className="space-y-4 border-slate-200 border-t p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    id={`exp-position-${index}`}
                    label="Position"
                    required
                    value={exp.position}
                    onValueChange={(value: string) => handleUpdate(index, "position", value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                  <TextInput
                    id={`exp-company-${index}`}
                    label="Company"
                    required
                    value={exp.company}
                    onValueChange={(value: string) => handleUpdate(index, "company", value)}
                    placeholder="e.g. Google Inc."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">Start Date *</p>
                    <DatePicker
                      selected={exp.startDate ?? undefined}
                      onSelect={(date: Date | undefined) => handleUpdate(index, "startDate", date ?? new Date())}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    {(() => {
                      const isInvalid = !exp.isCurrent && !exp.endDate && (invalidIndices?.has(index) ?? false);
                      return (
                        <>
                          <p
                            className={cn(
                              "mb-1.5 block font-medium text-sm",
                              isInvalid ? "text-red-500" : "text-slate-700",
                            )}
                          >
                            End Date {!exp.isCurrent && "*"}
                          </p>
                          <DatePicker
                            selected={exp.endDate ?? undefined}
                            onSelect={(date: Date | undefined) => handleUpdate(index, "endDate", date ?? null)}
                            placeholder="Select end date"
                            disabled={exp.isCurrent}
                            minDate={exp.startDate ?? undefined}
                          />
                          {isInvalid && <p className="mt-1 text-red-500 text-xs">End date is required</p>}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${exp.id}`}
                    checked={exp.isCurrent}
                    onChange={() => {
                      const newValue = !exp.isCurrent;
                      const updated = experience.map((expItem, i) =>
                        i === index
                          ? {
                              ...expItem,
                              isCurrent: newValue,
                              endDate: newValue ? null : expItem.endDate,
                            }
                          : expItem,
                      );
                      onChange(updated);
                    }}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-primary-600"
                  />
                  <label htmlFor={`current-${exp.id}`} className="cursor-pointer text-slate-700 text-sm">
                    I currently work here
                  </label>
                </div>

                <div>
                  <p className="mb-1.5 block font-medium text-slate-700 text-sm">Description</p>
                  <RichTextEditor
                    content={exp.description}
                    onChange={(html: string) => handleUpdate(index, "description", html)}
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {experience.length === 0 && (
        <EmptyState message="No work experience added yet. Click &quot;Add&quot; to get started." />
      )}
    </div>
  );
}
