import { generateUuidKey } from "@rezumerai/utils";
import { formatShortDate } from "@rezumerai/utils/date";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import HtmlContent from "./HtmlContent";
import type { TemplateProps } from "./types";

/**
 * Classic resume template with a centered header and bordered sections.
 *
 * @param props - {@link TemplateProps}
 * @returns The classic-style resume layout
 */
const ClassicTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-4xl bg-white p-8 text-gray-800 leading-relaxed">
      {/* Header */}
      <header className="mb-8 border-b-2 pb-6 text-center" style={{ borderColor: accentColor }}>
        <h1 className="mb-2 font-bold" style={{ color: accentColor, fontSize: "1.875em" }}>
          {data.personalInfo.fullName || "Your Name"}
        </h1>

        <div className="flex flex-wrap justify-center gap-4 text-gray-600" style={{ fontSize: "0.875em" }}>
          {data.personalInfo.email && (
            <div className="flex items-center gap-1">
              <Mail className="size-4" />
              <span>{data.personalInfo.email}</span>
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="flex items-center gap-1">
              <Phone className="size-4" />
              <span>{data.personalInfo.phone}</span>
            </div>
          )}
          {data.personalInfo.location && (
            <div className="flex items-center gap-1">
              <MapPin className="size-4" />
              <span>{data.personalInfo.location}</span>
            </div>
          )}
          {data.personalInfo.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="size-4" />
              <span className="break-all">{data.personalInfo.linkedin}</span>
            </div>
          )}
          {data.personalInfo.website && (
            <div className="flex items-center gap-1">
              <Globe className="size-4" />
              <span className="break-all">{data.personalInfo.website}</span>
            </div>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      {data.professionalSummary && (
        <section className="mb-6">
          <h2 className="mb-3 font-semibold" style={{ color: accentColor, fontSize: "1.25em" }}>
            PROFESSIONAL SUMMARY
          </h2>
          <HtmlContent html={data.professionalSummary} className="rich-text-content text-gray-700 leading-relaxed" />
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold" style={{ color: accentColor, fontSize: "1.25em" }}>
            PROFESSIONAL EXPERIENCE
          </h2>

          <div className="space-y-4">
            {data.experience.map((exp) => {
              const key = generateUuidKey();
              return (
                <div key={key} className="border-l-3 pl-4" style={{ borderColor: accentColor }}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                      <p className="font-medium text-gray-700">{exp.company}</p>
                    </div>
                    <div className="text-right text-gray-600" style={{ fontSize: "0.875em" }}>
                      <p>
                        {formatShortDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatShortDate(exp.endDate)}
                      </p>
                    </div>
                  </div>
                  {exp.description && (
                    <HtmlContent html={exp.description} className="rich-text-content text-gray-700 leading-relaxed" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.project && data.project.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold" style={{ color: accentColor, fontSize: "1.25em" }}>
            PROJECTS
          </h2>

          <ul className="space-y-3">
            {data.project.map((proj) => {
              const key = generateUuidKey();
              return (
                <div key={key} className="flex items-start justify-between border-gray-300 border-l-3 pl-6">
                  <div>
                    <li className="font-semibold text-gray-800">{proj.name}</li>
                    <HtmlContent html={proj.description} className="rich-text-content text-gray-600" />
                  </div>
                </div>
              );
            })}
          </ul>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold" style={{ color: accentColor, fontSize: "1.25em" }}>
            EDUCATION
          </h2>

          <div className="space-y-3">
            {data.education.map((edu) => {
              const key = generateUuidKey();
              return (
                <div key={key} className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-gray-700">{edu.institution}</p>
                    {edu.gpa && (
                      <p className="text-gray-600" style={{ fontSize: "0.875em" }}>
                        GPA: {edu.gpa}
                      </p>
                    )}
                  </div>
                  <div className="text-gray-600" style={{ fontSize: "0.875em" }}>
                    <p>{formatShortDate(edu.graduationDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 font-semibold" style={{ color: accentColor, fontSize: "1.25em" }}>
            CORE SKILLS
          </h2>

          <div className="flex flex-wrap gap-4">
            {data.skills.map((skill) => {
              const key = generateUuidKey();
              return (
                <div key={key} className="text-gray-700">
                  • {skill}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;
