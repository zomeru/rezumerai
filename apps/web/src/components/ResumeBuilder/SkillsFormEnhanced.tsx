"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import DraggableList from "./DraggableList";
import { EmptyState, SectionHeader } from "./Inputs";

/**
 * Props for the SkillsFormEnhanced component.
 *
 * @property skills - Array of skill name strings
 * @property onChange - Callback with updated skills array
 */
export interface SkillsFormEnhancedProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

/**
 * Enhanced skills form with autocomplete suggestions and drag-and-drop reordering.
 * Supports adding skills via text input with Enter key, removing individual skills,
 * and reordering via drag handles. Provides common skill suggestions based on input.
 *
 * @param props - Form configuration with skills data and change handler
 * @returns Skills form with suggestions, DnD reordering, and skill tags
 */

export default function SkillsFormEnhanced({ skills, onChange }: SkillsFormEnhancedProps): React.JSX.Element {
  const [newSkill, setNewSkill] = useState("");

  const handleAdd = (): void => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onChange([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemove = (index: number): void => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  // Common skills suggestions
  const suggestions = [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "SQL",
    "Git",
    "Docker",
    "AWS",
    "Azure",
    "Leadership",
    "Communication",
    "Problem Solving",
    "Team Collaboration",
  ];

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !skills.includes(suggestion) && suggestion.toLowerCase().includes(newSkill.toLowerCase()) && newSkill.length > 0,
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="Skills" showAddButton={false} />

      <div className="space-y-2">
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a skill (e.g. JavaScript, Leadership)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newSkill.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" />
              Add
            </button>
          </div>

          {filteredSuggestions.length > 0 && (
            <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
              {filteredSuggestions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={(): void => {
                    onChange([...skills, suggestion]);
                    setNewSkill("");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-slate-500 text-xs">Press Enter or click Add to add a skill</p>
      </div>

      {skills.length > 0 && (
        <DraggableList
          items={skills.map((skill, index) => ({ id: `${skill}-${index}`, name: skill }))}
          onReorder={(reordered: Array<{ id: string; name: string }>): void =>
            onChange(reordered.map((item) => item.name))
          }
          getItemId={(item: { id: string; name: string }): string => item.id}
          renderItem={(item: { id: string; name: string }): React.JSX.Element => (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-slate-900 text-sm">{item.name}</span>
              <button
                type="button"
                onClick={(): void => {
                  const index = skills.indexOf(item.name);
                  if (index !== -1) handleRemove(index);
                }}
                className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        />
      )}

      {skills.length === 0 && <EmptyState message="No skills added yet. Start adding your skills above." />}
    </div>
  );
}
