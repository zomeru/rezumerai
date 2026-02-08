"use client";

import { formatFullDate, formatShortDate, parseYearMonth } from "@rezumerai/utils/date";
import { useState } from "react";
import type { Experience } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import DatePicker from "./DatePicker";
import DraggableList from "./DraggableList";
import { DeleteButton, EmptyState, SectionHeader, TextInput } from "./Inputs";
import RichTextEditor from "./RichTextEditor";

interface ExperienceFormEnhancedProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
}

export default function ExperienceFormEnhanced({
  experience,
  onChange,
}: ExperienceFormEnhancedProps): React.JSX.Element {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = (): void => {
    const newExperience: Experience = {
      _id: generateUuidKey(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrent: false,
    };
    onChange([...experience, newExperience]);
    setExpandedIndex(experience.length);
  };

  const handleRemove = (index: number): void => {
    const updated = experience.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Experience, value: string | boolean): void => {
    const updated = experience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Work Experience" onAdd={handleAdd} />

      <DraggableList
        items={experience}
        onReorder={onChange}
        getItemId={(item: Experience): string => item._id}
        renderItem={(exp: Experience, index: number): React.JSX.Element => (
          <div className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={(): void => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {exp.position || "Position"} {exp.company && `at ${exp.company}`}
                </p>
                <p className="text-slate-500 text-sm">
                  {exp.startDate && formatShortDate(exp.startDate)}
                  {exp.startDate && " - "}
                  {exp.isCurrent ? "Present" : exp.endDate && formatShortDate(exp.endDate)}
                </p>
              </div>
              <DeleteButton
                onDelete={(): void => handleRemove(index)}
                ariaLabel={`Delete ${exp.position || "experience"}`}
              />
            </button>

            {expandedIndex === index && (
              <div className="space-y-4 border-slate-200 border-t p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    id={`exp-position-${index}`}
                    label="Position"
                    required
                    value={exp.position}
                    onValueChange={(value: string): void => handleUpdate(index, "position", value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                  <TextInput
                    id={`exp-company-${index}`}
                    label="Company"
                    required
                    value={exp.company}
                    onValueChange={(value: string): void => handleUpdate(index, "company", value)}
                    placeholder="e.g. Google Inc."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">Start Date *</p>
                    <DatePicker
                      selected={parseYearMonth(exp.startDate)}
                      onSelect={(date: Date | undefined): void =>
                        handleUpdate(index, "startDate", formatFullDate(date))
                      }
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">End Date</p>
                    <DatePicker
                      selected={parseYearMonth(exp.endDate)}
                      onSelect={(date: Date | undefined): void => handleUpdate(index, "endDate", formatFullDate(date))}
                      placeholder="Select end date"
                      disabled={exp.isCurrent}
                      minDate={parseYearMonth(exp.startDate)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${exp._id}`}
                    checked={exp.isCurrent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                      handleUpdate(index, "isCurrent", e.target.checked);
                      if (e.target.checked) {
                        handleUpdate(index, "endDate", "");
                      }
                    }}
                    className="size-4 rounded border-slate-300 text-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                  <label htmlFor={`current-${exp._id}`} className="text-slate-700 text-sm">
                    I currently work here
                  </label>
                </div>

                <div>
                  <p className="mb-1.5 block font-medium text-slate-700 text-sm">Description</p>
                  <RichTextEditor
                    content={exp.description}
                    onChange={(html: string): void => handleUpdate(index, "description", html)}
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
