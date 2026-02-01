"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import DraggableList from "./DraggableList";

interface SkillsFormEnhancedProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillsFormEnhanced({ skills, onChange }: SkillsFormEnhancedProps) {
  const [newSkill, setNewSkill] = useState("");

  const handleAdd = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onChange([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-slate-900">Skills</h3>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
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
                  onClick={() => {
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
          onReorder={(reordered) => onChange(reordered.map((item) => item.name))}
          getItemId={(item) => item.id}
          renderItem={(item) => (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-slate-900 text-sm">{item.name}</span>
              <button
                type="button"
                onClick={() => {
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

      {skills.length === 0 && (
        <div className="rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-8 text-center">
          <p className="text-slate-500">No skills added yet. Start adding your skills above.</p>
        </div>
      )}
    </div>
  );
}
