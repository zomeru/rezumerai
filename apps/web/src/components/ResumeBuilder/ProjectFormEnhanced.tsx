"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Project } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import DraggableList from "./DraggableList";
import RichTextEditor from "./RichTextEditor";

interface ProjectFormEnhancedProps {
  project: Project[];
  onChange: (project: Project[]) => void;
}

export default function ProjectFormEnhanced({ project, onChange }: ProjectFormEnhancedProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = () => {
    const newProject: Project = {
      _id: generateUuidKey(),
      name: "",
      type: "",
      description: "",
    };
    onChange([...project, newProject]);
    setExpandedIndex(project.length);
  };

  const handleRemove = (index: number) => {
    const updated = project.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Project, value: string) => {
    const updated = project.map((proj, i) => (i === index ? { ...proj, [field]: value } : proj));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-slate-900">Projects</h3>
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
        items={project}
        onReorder={onChange}
        getItemId={(item) => item._id}
        renderItem={(proj, index) => (
          <div className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">{proj.name || "Project Name"}</p>
                <p className="text-slate-500 text-sm">{proj.type || "Project Type"}</p>
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
                  <label htmlFor={`proj-name-${index}`} className="mb-1.5 block font-medium text-slate-700 text-sm">
                    Project Name *
                  </label>
                  <input
                    id={`proj-name-${index}`}
                    type="text"
                    value={proj.name}
                    onChange={(e) => handleUpdate(index, "name", e.target.value)}
                    placeholder="e.g. E-commerce Platform"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label htmlFor={`proj-type-${index}`} className="mb-1.5 block font-medium text-slate-700 text-sm">
                    Project Type
                  </label>
                  <input
                    id={`proj-type-${index}`}
                    type="text"
                    value={proj.type}
                    onChange={(e) => handleUpdate(index, "type", e.target.value)}
                    placeholder="e.g. Web Application, Mobile App"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <p className="mb-1.5 block font-medium text-slate-700 text-sm">Description</p>
                  <RichTextEditor
                    content={proj.description}
                    onChange={(html) => handleUpdate(index, "description", html)}
                    placeholder="Describe the project, technologies used, and your role..."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {project.length === 0 && (
        <div className="rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No projects added yet. Click "Add" to get started.</p>
        </div>
      )}
    </div>
  );
}
