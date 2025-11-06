import { formatShortDate } from "@rezumerai/utils/date";
import { Globe, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "./types";

const ModernTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-4xl bg-white text-gray-800">
      {/* Header */}
      <header className="p-8 text-white" style={{ backgroundColor: accentColor }}>
        <h1 className="mb-3 font-light text-4xl">{data.personal_info?.full_name || "Your Name"}</h1>

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {data.personal_info?.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4" />
              <span>{data.personal_info.email}</span>
            </div>
          )}
          {data.personal_info?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4" />
              <span>{data.personal_info.phone}</span>
            </div>
          )}
          {data.personal_info?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <span>{data.personal_info.location}</span>
            </div>
          )}
          {data.personal_info?.linkedin && (
            <a target="_blank" href={data.personal_info?.linkedin} className="flex items-center gap-2">
              <Linkedin className="size-4" />
              <span className="break-all text-xs">
                {data.personal_info.linkedin.split("https://www.")[1]
                  ? data.personal_info.linkedin.split("https://www.")[1]
                  : data.personal_info.linkedin}
              </span>
            </a>
          )}
          {data.personal_info?.website && (
            <a target="_blank" href={data.personal_info?.website} className="flex items-center gap-2">
              <Globe className="size-4" />
              <span className="break-all text-xs">
                {data.personal_info.website.split("https://")[1]
                  ? data.personal_info.website.split("https://")[1]
                  : data.personal_info.website}
              </span>
            </a>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Professional Summary */}
        {data.professional_summary && (
          <section className="mb-8">
            <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-2xl">Professional Summary</h2>
            <p className="text-gray-700">{data.professional_summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-6 border-gray-200 border-b pb-2 font-light text-2xl">Experience</h2>

            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp?.description} className="relative border-gray-200 border-l pl-6">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-xl">{exp?.position}</h3>
                      <p className="font-medium" style={{ color: accentColor }}>
                        {exp?.company}
                      </p>
                    </div>
                    <div className="rounded bg-gray-100 px-3 py-1 text-gray-500 text-sm">
                      {formatShortDate(exp?.start_date ?? "")} -{" "}
                      {exp?.is_current ? "Present" : formatShortDate(exp?.end_date ?? "")}
                    </div>
                  </div>
                  {exp?.description && (
                    <div className="mt-3 whitespace-pre-line text-gray-700 leading-relaxed">{exp.description}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {data.project && data.project.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-2xl">Projects</h2>

            <div className="space-y-6">
              {data.project.map((p) => (
                <div
                  key={p?.description}
                  className="relative border-gray-200 border-l pl-6"
                  style={{ borderLeftColor: accentColor }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{p?.name}</h3>
                    </div>
                  </div>
                  {p?.description && <div className="mt-3 text-gray-700 text-sm leading-relaxed">{p.description}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section>
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-2xl">Education</h2>

              <div className="space-y-4">
                {data.education.map((edu) => (
                  <div key={edu?.institution}>
                    <h3 className="font-semibold text-gray-900">
                      {edu?.degree} {edu?.field && `in ${edu?.field}`}
                    </h3>
                    <p style={{ color: accentColor }}>{edu?.institution}</p>
                    <div className="flex items-center justify-between text-gray-600 text-sm">
                      <span>{formatShortDate(edu?.graduation_date ?? "")}</span>
                      {edu?.gpa && <span>GPA: {edu?.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-light text-2xl">Skills</h2>

              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full px-3 py-1 text-sm text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
