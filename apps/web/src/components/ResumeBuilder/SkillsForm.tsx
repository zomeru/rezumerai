import { Plus, Sparkle, X } from "lucide-react";
import { useState } from "react";
import type { Skills } from "@/constants/dummy";

interface SkillFormProps {
  skills: Skills;
  onChange: (skills: Skills) => void;
}

export default function SkillsForm({ skills, onChange }: SkillFormProps) {
  const [newSkill, setNewSkill] = useState("");

  function addSkill() {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setNewSkill("");
    }
  }

  function removeSkill(skillIndex: number) {
    onChange(skills.filter((_, index) => index !== skillIndex));
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  }

  function onSkillInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewSkill(e.target.value);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-lg">Skills</h3>
        <p className="text-gray-500 text-sm">Add your technical and soft skills.</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter a skill (e.g. TypeScript, React, etc...)"
          className="flex-1 px-3 py-2 text-sm"
          onChange={onSkillInputChange}
          value={newSkill}
          onKeyDown={handleKeyPress}
        />
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm text-white transition-color hover:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={addSkill}
          disabled={!newSkill.trim()}
        >
          <Plus className="size-4" /> Add
        </button>
      </div>

      {skills.length ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={skill}
              className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-primary-800 text-sm"
            >
              {skill}
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-primary-200"
                onClick={() => removeSkill(index)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-500">
          <Sparkle className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p>No skills added yet.</p>
          <p className="text-sm">Add your technical and soft skills above.</p>
        </div>
      )}

      <div className="rounded-lg bg-primary-50 p-3">
        <p className="text-primary-800 text-sm">
          <strong>Tip: </strong>
          Add 8-12 relevant skills. Include both technical skills (e.g. React, TypeScript) and soft skills (e.g.
          Communication, Leadership).
        </p>
      </div>
    </div>
  );
}
