import { formatShortDate } from "@rezumerai/utils/date";
import { generateUuidKey } from "@/lib/utils";
import type { TemplateProps } from "./types";

const MinimalTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-4xl bg-white p-8 font-light text-gray-900">
      {/* Header */}
      <header className="mb-10">
        <h1 className="mb-4 font-thin text-4xl tracking-wide">{data.personalInfo.fullName || "Your Name"}</h1>

        <div className="flex flex-wrap gap-6 text-gray-600 text-sm">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
          {data.personalInfo.linkedin && <span className="break-all">{data.personalInfo.linkedin}</span>}
          {data.personalInfo.website && <span className="break-all">{data.personalInfo.website}</span>}
        </div>
      </header>

      {/* Professional Summary */}
      {data.professionalSummary && (
        <section className="mb-10">
          <p className="text-gray-700">{data.professionalSummary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-6 font-medium text-sm uppercase tracking-widest" style={{ color: accentColor }}>
            Experience
          </h2>

          <div className="space-y-6">
            {data.experience.map((exp) => {
              const key = generateUuidKey();
              return (
                <div key={key}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <h3 className="font-medium text-lg">{exp.position}</h3>
                    <span className="text-gray-500 text-sm">
                      {formatShortDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatShortDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="mb-2 text-gray-600">{exp.company}</p>
                  {exp.description && (
                    <div className="whitespace-pre-line text-gray-700 leading-relaxed">{exp.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.project && data.project.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-6 font-medium text-sm uppercase tracking-widest" style={{ color: accentColor }}>
            Projects
          </h2>

          <div className="space-y-4">
            {data.project.map((proj) => {
              const key = generateUuidKey();
              return (
                <div key={key} className="flex flex-col items-baseline justify-between gap-2">
                  <h3 className="font-medium text-lg">{proj.name}</h3>
                  <p className="text-gray-600">{proj.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-6 font-medium text-sm uppercase tracking-widest" style={{ color: accentColor }}>
            Education
          </h2>

          <div className="space-y-4">
            {data.education.map((edu) => {
              const key = generateUuidKey();
              return (
                <div key={key} className="flex items-baseline justify-between">
                  <div>
                    <h3 className="font-medium">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    {edu.gpa && <p className="text-gray-500 text-sm">GPA: {edu.gpa}</p>}
                  </div>
                  <span className="text-gray-500 text-sm">{formatShortDate(edu.graduationDate)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section>
          <h2 className="mb-6 font-medium text-sm uppercase tracking-widest" style={{ color: accentColor }}>
            Skills
          </h2>

          <div className="text-gray-700">{data.skills.join(" • ")}</div>
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;
