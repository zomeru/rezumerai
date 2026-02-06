import { formatShortDate } from "@rezumerai/utils/date";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { generateUuidKey } from "@/lib/utils";
import HtmlContent from "./HtmlContent";
import type { TemplateProps } from "./types";

const ModernTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-4xl bg-white text-gray-800">
      {/* Header */}
      <header className="p-8 text-white" style={{ backgroundColor: accentColor }}>
        <h1 className="mb-3 font-light text-[2.25em]">{data.personalInfo.fullName || "Your Name"}</h1>

        <div className="grid grid-cols-1 gap-2 text-[0.875em] sm:grid-cols-2">
          {data.personalInfo.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4" />
              <span>{data.personalInfo.email}</span>
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4" />
              <span>{data.personalInfo.phone}</span>
            </div>
          )}
          {data.personalInfo.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <span>{data.personalInfo.location}</span>
            </div>
          )}
          {data.personalInfo.linkedin && (
            <a target="_blank" href={data.personalInfo.linkedin} className="flex items-center gap-2">
              <Linkedin className="size-4" />
              <span className="break-all text-[0.75em]">
                {data.personalInfo.linkedin.split("https://www.")[1]
                  ? data.personalInfo.linkedin.split("https://www.")[1]
                  : data.personalInfo.linkedin}
              </span>
            </a>
          )}
          {data.personalInfo.website && (
            <a target="_blank" href={data.personalInfo.website} className="flex items-center gap-2">
              <Globe className="size-4" />
              <span className="break-all text-[0.75em]">
                {data.personalInfo.website.split("https://")[1]
                  ? data.personalInfo.website.split("https://")[1]
                  : data.personalInfo.website}
              </span>
            </a>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Professional Summary */}
        {data.professionalSummary && (
          <section className="mb-8">
            <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-[1.5em]">Professional Summary</h2>
            <HtmlContent html={data.professionalSummary} className="rich-text-content text-gray-700" />
          </section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-6 border-gray-200 border-b pb-2 font-light text-[1.5em]">Experience</h2>

            <div className="space-y-6">
              {data.experience.map((exp) => {
                const key = generateUuidKey();
                return (
                  <div key={key} className="relative border-gray-200 border-l pl-6">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[1.25em] text-gray-900">{exp.position}</h3>
                        <p className="font-medium" style={{ color: accentColor }}>
                          {exp.company}
                        </p>
                      </div>
                      <div className="rounded bg-gray-100 px-3 py-1 text-[0.875em] text-gray-500">
                        {formatShortDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatShortDate(exp.endDate)}
                      </div>
                    </div>
                    {exp.description && (
                      <HtmlContent
                        html={exp.description}
                        className="rich-text-content mt-3 text-gray-700 leading-relaxed"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Projects */}
        {data.project && data.project.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-[1.5em]">Projects</h2>

            <div className="space-y-6">
              {data.project.map((p) => {
                const key = generateUuidKey();
                return (
                  <div
                    key={key}
                    className="relative border-gray-200 border-l pl-6"
                    style={{ borderLeftColor: accentColor }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-[1.125em] text-gray-900">{p.name}</h3>
                      </div>
                    </div>
                    {p.description && (
                      <HtmlContent
                        html={p.description}
                        className="rich-text-content mt-3 text-[0.875em] text-gray-700 leading-relaxed"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section>
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-[1.5em]">Education</h2>

              <div className="space-y-4">
                {data.education.map((edu) => {
                  const key = generateUuidKey();
                  return (
                    <div key={key}>
                      <h3 className="font-semibold text-gray-900">
                        {edu.degree} {edu.field && `in ${edu.field}`}
                      </h3>
                      <p style={{ color: accentColor }}>{edu.institution}</p>
                      <div className="flex items-center justify-between text-[0.875em] text-gray-600">
                        <span>{formatShortDate(edu.graduationDate)}</span>
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-[1.5em]">Skills</h2>

              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => {
                  const key = generateUuidKey();
                  return (
                    <span
                      key={key}
                      className="rounded-full px-3 py-1 text-[0.875em] text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
