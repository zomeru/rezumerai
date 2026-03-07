"use client";

import type { ResumeWithRelations } from "@rezumerai/types";
import { generateUuidKey } from "@rezumerai/utils";
import { formatShortDate } from "@rezumerai/utils/date";
import { useState } from "react";
import DatePicker from "./DatePicker";
import DraggableList from "./DraggableList";
import { DeleteButton, EmptyState, SectionHeader, TextInput } from "./Inputs";

type Education = ResumeWithRelations["education"];

/**
 * Props for the EducationFormEnhanced component.
 *
 * @property education - Array of education entries
 * @property onChange - Callback with updated education array
 * @property errors - Field-level errors indexed by entry position
 */
export interface EducationFormEnhancedProps {
  education: Education;
  onChange: (education: Education) => void;
  errors?: Record<number, Record<string, string>>;
}

/**
 * Enhanced education form with drag-and-drop reordering.
 * Supports adding, removing, and editing education entries with
 * accordion expand/collapse, date picker, and field inputs.
 *
 * @param props - Form configuration with education data and change handler
 * @returns Education form with DnD reordering and accordion entries
 */

export default function EducationFormEnhanced({ education, onChange, errors = {} }: EducationFormEnhancedProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = () => {
    const newEducation: Education[number] = {
      id: generateUuidKey(),
      resumeId: education[0]?.resumeId || "",
      institution: "",
      degree: "",
      field: "",
      schoolYearStartDate: new Date(),
      graduationDate: null,
      isCurrent: false,
      gpa: "",
    };
    onChange([...education, newEducation]);
    setExpandedIndex(education.length);
  };

  const handleRemove = (index: number) => {
    const updated = education.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Education[number], value: string | Date | null | boolean) => {
    const updated = education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Education" onAdd={handleAdd} />

      <DraggableList
        items={education}
        onReorder={onChange}
        getItemId={(item: Education[number]): string => item.id}
        renderItem={(edu: Education[number], index: number) => (
          <div className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {edu.degree || "Degree"} {edu.field && `in ${edu.field}`}
                </p>
                <p className="text-slate-500 text-sm">
                  {edu.institution || "Institution"}
                  {edu.graduationDate && ` • ${formatShortDate(edu.graduationDate)}`}
                </p>
              </div>
              <DeleteButton onDelete={() => handleRemove(index)} ariaLabel={`Delete ${edu.degree || "education"}`} />
            </button>

            {expandedIndex === index && (
              <div className="space-y-4 border-slate-200 border-t p-4">
                <TextInput
                  id={`edu-institution-${index}`}
                  label="Institution"
                  required
                  value={edu.institution}
                  onValueChange={(value: string) => handleUpdate(index, "institution", value)}
                  placeholder="e.g. Harvard University"
                  error={errors[index]?.institution}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    id={`edu-degree-${index}`}
                    label="Degree"
                    required
                    value={edu.degree}
                    onValueChange={(value: string) => handleUpdate(index, "degree", value)}
                    placeholder="e.g. Bachelor of Science"
                    error={errors[index]?.degree}
                  />
                  <TextInput
                    id={`edu-field-${index}`}
                    label="Field of Study"
                    value={edu.field}
                    onValueChange={(value: string) => handleUpdate(index, "field", value)}
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">
                      School Year Start Date<span className="text-red-500"> *</span>
                    </p>
                    <DatePicker
                      selected={(edu as { schoolYearStartDate?: Date }).schoolYearStartDate ?? undefined}
                      onSelect={(date: Date | undefined) => handleUpdate(index, "schoolYearStartDate", date ?? null)}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">Graduation Date</p>
                    <DatePicker
                      selected={edu.graduationDate ?? undefined}
                      onSelect={(date: Date | undefined) => handleUpdate(index, "graduationDate", date ?? null)}
                      placeholder="Select graduation date"
                      disabled={(edu as { isCurrent?: boolean }).isCurrent ?? false}
                    />
                  </div>
                </div>

                <div className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edu-current-${index}`}
                    checked={(edu as { isCurrent?: boolean }).isCurrent ?? false}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const isChecked = e.target.checked;
                      if (isChecked) {
                        handleUpdate(index, "graduationDate", null);
                        handleUpdate(index, "isCurrent", true);
                      } else {
                        handleUpdate(index, "isCurrent", false);
                      }
                    }}
                    className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={`edu-current-${index}`} className="text-slate-700 text-sm">
                    Currently studying
                  </label>
                </div>

                <TextInput
                  id={`edu-gpa-${index}`}
                  label="GPA (Optional)"
                  value={edu.gpa}
                  onValueChange={(value: string) => handleUpdate(index, "gpa", value)}
                  placeholder="e.g. 3.8 or 8.5/10"
                />
              </div>
            )}
          </div>
        )}
      />

      {education.length === 0 && <EmptyState message="No education added yet. Click &quot;Add&quot; to get started." />}
    </div>
  );
}
