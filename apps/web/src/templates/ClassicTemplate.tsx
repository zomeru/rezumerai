import { formatShortDate } from "@rezumerai/utils/date";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "./types";

const ClassicTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-gray-800 leading-relaxed">
      {/* Header */}
      <header className="mb-8 border-b-2 pb-6 text-center" style={{ borderColor: accentColor }}>
        <h1 className="mb-2 font-bold text-3xl" style={{ color: accentColor }}>
          {data.personal_info?.full_name || "Your Name"}
        </h1>

        <div className="flex flex-wrap justify-center gap-4 text-gray-600 text-sm">
          {data.personal_info?.email && (
            <div className="flex items-center gap-1">
              <Mail className="size-4" />
              <span>{data.personal_info.email}</span>
            </div>
          )}
          {data.personal_info?.phone && (
            <div className="flex items-center gap-1">
              <Phone className="size-4" />
              <span>{data.personal_info.phone}</span>
            </div>
          )}
          {data.personal_info?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="size-4" />
              <span>{data.personal_info.location}</span>
            </div>
          )}
          {data.personal_info?.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="size-4" />
              <span className="break-all">{data.personal_info.linkedin}</span>
            </div>
          )}
          {data.personal_info?.website && (
            <div className="flex items-center gap-1">
              <Globe className="size-4" />
              <span className="break-all">{data.personal_info.website}</span>
            </div>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      {data.professional_summary && (
        <section className="mb-6">
          <h2 className="mb-3 font-semibold text-xl" style={{ color: accentColor }}>
            PROFESSIONAL SUMMARY
          </h2>
          <p className="text-gray-700 leading-relaxed">{data.professional_summary}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold text-xl" style={{ color: accentColor }}>
            PROFESSIONAL EXPERIENCE
          </h2>

          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.company} className="border-l-3 pl-4" style={{ borderColor: accentColor }}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                    <p className="font-medium text-gray-700">{exp.company}</p>
                  </div>
                  <div className="text-right text-gray-600 text-sm">
                    <p>
                      {formatShortDate(exp.start_date)} -{" "}
                      {exp.is_current ? "Present" : formatShortDate(exp.end_date ?? "")}
                    </p>
                  </div>
                </div>
                {exp.description && (
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">{exp.description}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.project && data.project.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold text-xl" style={{ color: accentColor }}>
            PROJECTS
          </h2>

          <ul className="space-y-3">
            {data.project.map((proj) => (
              <div key={proj.description} className="flex items-start justify-between border-gray-300 border-l-3 pl-6">
                <div>
                  <li className="font-semibold text-gray-800">{proj.name}</li>
                  <p className="text-gray-600">{proj.description}</p>
                </div>
              </div>
            ))}
          </ul>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold text-xl" style={{ color: accentColor }}>
            EDUCATION
          </h2>

          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.institution} className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </h3>
                  <p className="text-gray-700">{edu.institution}</p>
                  {edu.gpa && <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>}
                </div>
                <div className="text-gray-600 text-sm">
                  <p>{formatShortDate(edu.graduation_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold text-xl" style={{ color: accentColor }}>
            CORE SKILLS
          </h2>

          <div className="flex flex-wrap gap-4">
            {data.skills.map((skill) => (
              <div key={skill} className="text-gray-700">
                • {skill}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;
