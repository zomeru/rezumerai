"use client";

import { useState } from "react";
import type { Project } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import DraggableList from "./DraggableList";
import { DeleteButton, EmptyState, SectionHeader, TextInput } from "./Inputs";
import RichTextEditor from "./RichTextEditor";

/**
 * Props for the ProjectFormEnhanced component.
 *
 * @property project - Array of project entries
 * @property onChange - Callback with updated project array
 */
export interface ProjectFormEnhancedProps {
  project: Project[];
  onChange: (project: Project[]) => void;
}

/**
 * Enhanced project portfolio form with drag-and-drop reordering.
 * Supports adding, removing, and editing project entries with
 * accordion expand/collapse and rich text descriptions.
 *
 * @param props - Form configuration with project data and change handler
 * @returns Project form with DnD reordering and accordion entries
 */

export default function ProjectFormEnhanced({ project, onChange }: ProjectFormEnhancedProps): React.JSX.Element {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = (): void => {
    const newProject: Project = {
      _id: generateUuidKey(),
      name: "",
      type: "",
      description: "",
    };
    onChange([...project, newProject]);
    setExpandedIndex(project.length);
  };

  const handleRemove = (index: number): void => {
    const updated = project.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof Project, value: string): void => {
    const updated = project.map((proj, i) => (i === index ? { ...proj, [field]: value } : proj));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Projects" onAdd={handleAdd} />

      <DraggableList
        items={project}
        onReorder={onChange}
        getItemId={(item: Project): string => item._id}
        renderItem={(proj: Project, index: number): React.JSX.Element => (
          <div className="rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={(): void => setExpandedIndex(expandedIndex === index ? null : index)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-900">{proj.name || "Project Name"}</p>
                <p className="text-slate-500 text-sm">{proj.type || "Project Type"}</p>
              </div>
              <DeleteButton onDelete={(): void => handleRemove(index)} ariaLabel={`Delete ${proj.name || "project"}`} />
            </button>

            {expandedIndex === index && (
              <div className="space-y-4 border-slate-200 border-t p-4">
                <TextInput
                  id={`proj-name-${index}`}
                  label="Project Name"
                  required
                  value={proj.name}
                  onValueChange={(value: string): void => handleUpdate(index, "name", value)}
                  placeholder="e.g. E-commerce Platform"
                />

                <TextInput
                  id={`proj-type-${index}`}
                  label="Project Type"
                  value={proj.type}
                  onValueChange={(value: string): void => handleUpdate(index, "type", value)}
                  placeholder="e.g. Web Application, Mobile App"
                />

                <div>
                  <p className="mb-1.5 block font-medium text-slate-700 text-sm">Description</p>
                  <RichTextEditor
                    content={proj.description}
                    onChange={(html: string): void => handleUpdate(index, "description", html)}
                    placeholder="Describe the project, technologies used, and your role..."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      />

      {project.length === 0 && <EmptyState message="No projects added yet. Click &quot;Add&quot; to get started." />}
    </div>
  );
}
