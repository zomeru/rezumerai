import { Plus, Trash2 } from "lucide-react";
import type { Project } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import { FormField } from "./Inputs";

interface ProjectFormProps {
  project: Project[];
  onChange: (project: Project[]) => void;
}

export default function ProjectForm({ project, onChange }: ProjectFormProps) {
  function addProject() {
    const newProject: Project = {
      _id: generateUuidKey(),
      name: "",
      type: "",
      description: "",
    };

    onChange([...project, newProject]);
  }

  function removeProject(projectIndex: number) {
    const updatedProject = project.filter((_, i) => projectIndex !== i);
    onChange(updatedProject);
  }

  function updateProject<K extends keyof Project>(projectIndex: number, field: K, value: Project[K]) {
    const updatedProject = [...project];

    if (updatedProject[projectIndex]) {
      updatedProject[projectIndex] = { ...updatedProject[projectIndex], [field]: value };
      onChange(updatedProject);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-900 text-lg">Projects</h3>
          <p className="text-gray-500 text-sm">Add your projects.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded bg-primary-100 px-3 py-1 text-primary-700 text-sm transition-colors hover:bg-primary-200"
          onClick={addProject}
        >
          <Plus className="size-4" />
          Add Project
        </button>
      </div>

      <div className="space-y-4">
        {project.map(({ description, name, type, _id }, index) => {
          const _key = generateUuidKey(_id);

          return (
            <div key={_key} className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <h4>Project {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="text-red-500 transition-colors hover:text-red-700"
                  aria-label={`Remove project ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-3">
                <FormField
                  value={name}
                  onValueChange={(value) => updateProject(index, "name", value)}
                  placeholder="Project Name"
                />
                <FormField
                  value={type}
                  onValueChange={(value) => updateProject(index, "type", value)}
                  placeholder="Project Type"
                />
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  placeholder="Describe your project.."
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
