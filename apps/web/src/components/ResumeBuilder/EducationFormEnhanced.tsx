"use client";

import { generateUuidKey } from "@rezumerai/utils";
import { formatFullDate, formatShortDate, parseYearMonth } from "@rezumerai/utils/date";
import { useState } from "react";
import type { Education } from "@/constants/dummy";
import DatePicker from "./DatePicker";
import DraggableList from "./DraggableList";
import { DeleteButton, EmptyState, SectionHeader, TextInput } from "./Inputs";

/**
 * Props for the EducationFormEnhanced component.
 *
 * @property education - Array of education entries
 * @property onChange - Callback with updated education array
 */
export interface EducationFormEnhancedProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

/**
 * Enhanced education form with drag-and-drop reordering.
 * Supports adding, removing, and editing education entries with
 * accordion expand/collapse, date picker, and field inputs.
 *
 * @param props - Form configuration with education data and change handler
 * @returns Education form with DnD reordering and accordion entries
 */

export default function EducationFormEnhanced({ education, onChange }: EducationFormEnhancedProps): React.JSX.Element {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = (): void => {
    const newEducation: Education = {
      _id: generateUuidKey(),
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
    };
    onChange([...education, newEducation]);
    setExpandedIndex(education.length);
  };

  const handleRemove = (index: number): void => {
    const updated = education.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Education, value: string): void => {
    const updated = education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Education" onAdd={handleAdd} />

      <DraggableList
        items={education}
        onReorder={onChange}
        getItemId={(item: Education): string => item._id}
        renderItem={(edu: Education, index: number): React.JSX.Element => (
          <div className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={(): void => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {edu.degree || "Degree"} {edu.field && `in ${edu.field}`}
                </p>
                <p className="text-slate-500 text-sm">
                  {edu.institution || "Institution"}
                  {edu.graduationDate &&
                    parseYearMonth(edu.graduationDate) &&
                    ` • ${formatShortDate(edu.graduationDate)}`}
                </p>
              </div>
              <DeleteButton
                onDelete={(): void => handleRemove(index)}
                ariaLabel={`Delete ${edu.degree || "education"}`}
              />
            </button>

            {expandedIndex === index && (
              <div className="space-y-4 border-slate-200 border-t p-4">
                <TextInput
                  id={`edu-institution-${index}`}
                  label="Institution"
                  required
                  value={edu.institution}
                  onValueChange={(value: string): void => handleUpdate(index, "institution", value)}
                  placeholder="e.g. Harvard University"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    id={`edu-degree-${index}`}
                    label="Degree"
                    required
                    value={edu.degree}
                    onValueChange={(value: string): void => handleUpdate(index, "degree", value)}
                    placeholder="e.g. Bachelor of Science"
                  />
                  <TextInput
                    id={`edu-field-${index}`}
                    label="Field of Study"
                    value={edu.field}
                    onValueChange={(value: string): void => handleUpdate(index, "field", value)}
                    placeholder="e.g. Computer Science"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">Graduation Date</p>
                    <DatePicker
                      selected={parseYearMonth(edu.graduationDate)}
                      onSelect={(date: Date | undefined): void =>
                        handleUpdate(index, "graduationDate", formatFullDate(date))
                      }
                      placeholder="Select graduation date"
                    />
                  </div>
                  <TextInput
                    id={`edu-gpa-${index}`}
                    label="GPA (Optional)"
                    value={edu.gpa}
                    onValueChange={(value: string): void => handleUpdate(index, "gpa", value)}
                    placeholder="e.g. 3.8 or 8.5/10"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {education.length === 0 && <EmptyState message="No education added yet. Click &quot;Add&quot; to get started." />}
    </div>
  );
}
