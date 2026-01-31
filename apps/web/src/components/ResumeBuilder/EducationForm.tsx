import { GraduationCap, Plus, Trash2 } from "lucide-react";
import type { Education } from "@/constants/dummy";
import { generateUuidKey } from "@/lib/utils";
import { FormField } from "./Inputs";

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export default function EducationForm({ education, onChange }: EducationFormProps) {
  function addEducation() {
    const newEducation: Education = {
      _id: "",
      degree: "",
      field: "",
      gpa: "",
      graduationDate: "",
      institution: "",
    };

    onChange([...education, newEducation]);
  }

  function removeEducation(educationIndex: number) {
    const updatedEducation = education.filter((_, i) => educationIndex !== i);
    onChange(updatedEducation);
  }

  function updateEducation<K extends keyof Education>(educationIndex: number, field: K, value: Education[K]) {
    const updatedEducation = [...education];

    if (updatedEducation?.[educationIndex]) {
      updatedEducation[educationIndex] = { ...updatedEducation[educationIndex], [field]: value };
      onChange(updatedEducation);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-800">Education</h3>
          <p className="text-slate-500 text-sm">Add your education details.</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded bg-primary-100 px-3 py-1 text-primary-700 text-sm transition-colors hover:bg-primary-200"
          onClick={addEducation}
        >
          <Plus className="size-4" />
          Add Education
        </button>
      </div>

      {education.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          <GraduationCap className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p>No education added yet.</p>
          <p className="text-sm">Click "Add Education" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map(({ degree, field, gpa, graduationDate, institution, _id }, index) => {
            const _key = generateUuidKey(_id);

            return (
              <div key={_key} className="space-y-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <h4>Education {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="text-red-500 transition-colors hover:text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    value={institution}
                    onValueChange={(value) => updateEducation(index, "institution", value)}
                    placeholder="Institution Name"
                  />
                  <FormField
                    value={degree}
                    onValueChange={(value) => updateEducation(index, "degree", value)}
                    placeholder="Degree (e.g. Bachelor's, Master's)"
                  />
                  <FormField
                    value={field}
                    onValueChange={(value) => updateEducation(index, "field", value)}
                    placeholder="Field of Study"
                  />
                  <FormField
                    value={graduationDate}
                    type="month"
                    onValueChange={(value) => updateEducation(index, "graduationDate", value)}
                    placeholder="Graduation Date"
                  />
                </div>

                <FormField
                  value={gpa}
                  onValueChange={(value) => updateEducation(index, "gpa", value)}
                  placeholder="GPA (Optional)"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
