"use client";

import { format, parse } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Education } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import DatePicker from "./DatePicker";
import DraggableList from "./DraggableList";

interface EducationFormEnhancedProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export default function EducationFormEnhanced({ education, onChange }: EducationFormEnhancedProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = () => {
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

  const handleRemove = (index: number) => {
    const updated = education.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Education, value: string) => {
    const updated = education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu));
    onChange(updated);
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return parse(dateStr, "yyyy-MM", new Date());
    } catch {
      return undefined;
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "yyyy-MM");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-slate-900">Education</h3>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-600"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      <DraggableList
        items={education}
        onReorder={onChange}
        getItemId={(item) => item._id}
        renderItem={(edu, index) => (
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
                  {edu.graduationDate &&
                    parseDate(edu.graduationDate) &&
                    ` • ${format(parseDate(edu.graduationDate) as Date, "MMM yyyy")}`}
                </p>
              </div>
              {/* biome-ignore lint/a11y/useSemanticElements: Cannot nest button inside button */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    handleRemove(index);
                  }
                }}
                role="button"
                tabIndex={0}
                className="ml-2 cursor-pointer rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </span>
            </button>

            {expandedIndex === index && (
              <div className="space-y-4 border-slate-200 border-t p-4">
                <div>
                  <label
                    htmlFor={`edu-institution-${index}`}
                    className="mb-1.5 block font-medium text-slate-700 text-sm"
                  >
                    Institution *
                  </label>
                  <input
                    id={`edu-institution-${index}`}
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleUpdate(index, "institution", e.target.value)}
                    placeholder="e.g. Harvard University"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`edu-degree-${index}`} className="mb-1.5 block font-medium text-slate-700 text-sm">
                      Degree *
                    </label>
                    <input
                      id={`edu-degree-${index}`}
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdate(index, "degree", e.target.value)}
                      placeholder="e.g. Bachelor of Science"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edu-field-${index}`} className="mb-1.5 block font-medium text-slate-700 text-sm">
                      Field of Study
                    </label>
                    <input
                      id={`edu-field-${index}`}
                      type="text"
                      value={edu.field}
                      onChange={(e) => handleUpdate(index, "field", e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">Graduation Date</p>
                    <DatePicker
                      selected={parseDate(edu.graduationDate)}
                      onSelect={(date) => handleUpdate(index, "graduationDate", formatDate(date))}
                      placeholder="Select graduation date"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edu-gpa-${index}`} className="mb-1.5 block font-medium text-slate-700 text-sm">
                      GPA (Optional)
                    </label>
                    <input
                      id={`edu-gpa-${index}`}
                      type="text"
                      value={edu.gpa}
                      onChange={(e) => handleUpdate(index, "gpa", e.target.value)}
                      placeholder="e.g. 3.8 or 8.5/10"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      />

      {education.length === 0 && (
        <div className="rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No education added yet. Click "Add" to get started.</p>
        </div>
      )}
    </div>
  );
}
