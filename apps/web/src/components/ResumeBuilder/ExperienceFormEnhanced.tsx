"use client";

import { format, parse } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Experience } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import DatePicker from "./DatePicker";
import DraggableList from "./DraggableList";
import RichTextEditor from "./RichTextEditor";

interface ExperienceFormEnhancedProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
}

export default function ExperienceFormEnhanced({ experience, onChange }: ExperienceFormEnhancedProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = () => {
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

  const handleRemove = (index: number) => {
    const updated = experience.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Experience, value: string | boolean) => {
    const updated = experience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp));
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
        <h3 className="font-semibold text-lg text-slate-900">Work Experience</h3>
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
        items={experience}
        onReorder={onChange}
        getItemId={(item) => item._id}
        renderItem={(exp, index) => (
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
                <p className="text-slate-500 text-sm">
                  {exp.startDate && parseDate(exp.startDate) && format(parseDate(exp.startDate) as Date, "MMM yyyy")}
                  {exp.startDate && " - "}
                  {exp.isCurrent
                    ? "Present"
                    : exp.endDate && parseDate(exp.endDate) && format(parseDate(exp.endDate) as Date, "MMM yyyy")}
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`exp-position-${index}`}
                      className="mb-1.5 block font-medium text-slate-700 text-sm"
                    >
                      Position *
                    </label>
                    <input
                      id={`exp-position-${index}`}
                      type="text"
                      value={exp.position}
                      onChange={(e) => handleUpdate(index, "position", e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor={`exp-company-${index}`} className="mb-1.5 block font-medium text-slate-700 text-sm">
                      Company *
                    </label>
                    <input
                      id={`exp-company-${index}`}
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleUpdate(index, "company", e.target.value)}
                      placeholder="e.g. Google Inc."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">Start Date *</p>
                    <DatePicker
                      selected={parseDate(exp.startDate)}
                      onSelect={(date) => handleUpdate(index, "startDate", formatDate(date))}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 block font-medium text-slate-700 text-sm">End Date</p>
                    <DatePicker
                      selected={parseDate(exp.endDate)}
                      onSelect={(date) => handleUpdate(index, "endDate", formatDate(date))}
                      placeholder="Select end date"
                      disabled={exp.isCurrent}
                      minDate={parseDate(exp.startDate)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-${exp._id}`}
                    checked={exp.isCurrent}
                    onChange={(e) => {
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
                    onChange={(html) => handleUpdate(index, "description", html)}
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {experience.length === 0 && (
        <div className="rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No work experience added yet. Click "Add" to get started.</p>
        </div>
      )}
    </div>
  );
}
