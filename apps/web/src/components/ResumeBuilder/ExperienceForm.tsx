import { Briefcase, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Experience } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";

interface ExperienceFormProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
}

export default function ExperienceForm({ experience = [], onChange }: ExperienceFormProps) {
  function addExperience() {
    const newExperience: Experience = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrent: false,
      _id: "",
    };

    onChange([...experience, newExperience]);
  }

  function removeExperience(experienceIndex: number) {
    const updatedExperience = experience.filter((_, i) => experienceIndex !== i);
    onChange(updatedExperience);
  }

  function updateExperience<K extends keyof Experience>(experienceIndex: number, field: K, value: Experience[K]) {
    const updatedExperience = [...experience];

    if (updatedExperience?.[experienceIndex]) {
      updatedExperience[experienceIndex] = { ...updatedExperience[experienceIndex], [field]: value };
      onChange(updatedExperience);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-lg">Professional Experience</h3>
          <p className="text-gray-500 text-sm">Add your professional job experience.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded bg-primary-100 px-3 py-1 text-primary-700 text-sm transition-colors hover:bg-primary-200"
          onClick={addExperience}
        >
          <Plus className="size-4" />
          Add Experience
        </button>
      </div>

      {experience.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p>No work experience added yet.</p>
          <p className="text-sm">Click "Add Experience" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map(({ company, description, endDate, isCurrent, position, startDate, _id }, index) => {
            const _key = generateUuidKey(_id);

            return (
              <div key={_key} className="space-y-3 rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <h4>Experience {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
                    className="text-red-500 transition-colors hover:text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    type="text"
                    placeholder="Company name"
                    className="rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={position}
                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                    type="text"
                    placeholder="Job Title"
                    className="rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                    type="month"
                    placeholder="Start Date"
                    className="rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={endDate}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    type="month"
                    placeholder="End Date"
                    className="rounded-lg px-3 py-2 text-sm"
                    disabled={isCurrent}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!isCurrent}
                    onChange={(e) => {
                      updateExperience(index, "isCurrent", e.target.checked);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700 text-sm">Currently working here</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 text-sm">Job Description</span>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded bg-accent-100 px-2 py-1 text-accent-700 text-xs transition-colors hover:bg-accent-200 disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" />
                      Enhance with AI
                    </button>
                  </div>
                  <textarea
                    value={description}
                    rows={4}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    className="w-full resize-none rounded-lg px-3 py-2 text-sm"
                    placeholder="Describe your key responsibilities and achievements"
                  ></textarea>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
