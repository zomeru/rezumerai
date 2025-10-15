import { formatShortDate } from "@rezumerai/utils/date";
import { Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "./types";

const MinimalImageTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-5xl bg-white text-zinc-800">
      <div className="grid grid-cols-3">
        <div className="col-span-1 py-10">
          {/* Image */}
          {data.personal_info?.image &&
          typeof data.personal_info.image === "string" ? (
            <div className="mb-6">
              <img
                src={data.personal_info.image}
                alt="Profile"
                className="mx-auto h-32 w-32 rounded-full object-cover"
                style={{ background: `${accentColor}70` }}
              />
            </div>
          ) : data.personal_info?.image &&
            typeof data.personal_info.image === "object" ? (
            <div className="mb-6">
              <img
                // src={URL.createObjectURL(data.personal_info.image)}
                src=""
                alt="Profile"
                className="mx-auto h-32 w-32 rounded-full object-cover"
              />
            </div>
          ) : null}
        </div>

        {/* Name + Title */}
        <div className="col-span-2 flex flex-col justify-center px-8 py-10">
          <h1 className="font-bold text-4xl text-zinc-700 tracking-widest">
            {data.personal_info?.full_name || "Your Name"}
          </h1>
          <p className="font-medium text-sm text-zinc-600 uppercase tracking-widest">
            {data?.personal_info?.profession || "Profession"}
          </p>
        </div>

        {/* Left Sidebar */}
        <aside className="col-span-1 border-zinc-400 border-r p-6 pt-0">
          {/* Contact */}
          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-sm text-zinc-600 tracking-widest">
              CONTACT
            </h2>
            <div className="space-y-2 text-sm">
              {data.personal_info?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: accentColor }} />
                  <span>{data.personal_info.phone}</span>
                </div>
              )}
              {data.personal_info?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} style={{ color: accentColor }} />
                  <span>{data.personal_info.email}</span>
                </div>
              )}
              {data.personal_info?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: accentColor }} />
                  <span>{data.personal_info.location}</span>
                </div>
              )}
            </div>
          </section>

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-semibold text-sm text-zinc-600 tracking-widest">
                EDUCATION
              </h2>
              <div className="space-y-4 text-sm">
                {data.education.map((edu) => (
                  <div key={edu.institution}>
                    <p className="font-semibold uppercase">{edu.degree}</p>
                    <p className="text-zinc-600">{edu.institution}</p>
                    <p className="text-xs text-zinc-500">
                      {formatShortDate(edu.graduation_date)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-sm text-zinc-600 tracking-widest">
                SKILLS
              </h2>
              <ul className="space-y-1 text-sm">
                {data.skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* Right Content */}
        <main className="col-span-2 p-8 pt-0">
          {/* Summary */}
          {data.professional_summary && (
            <section className="mb-8">
              <h2
                className="mb-3 font-semibold text-sm tracking-widest"
                style={{ color: accentColor }}
              >
                SUMMARY
              </h2>
              <p className="text-zinc-700 leading-relaxed">
                {data.professional_summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <section>
              <h2
                className="mb-4 font-semibold text-sm tracking-widest"
                style={{ color: accentColor }}
              >
                EXPERIENCE
              </h2>
              <div className="mb-8 space-y-6">
                {data.experience.map((exp) => (
                  <div key={exp.company}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-900">
                        {exp.position}
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(exp.start_date)} -{" "}
                        {exp.is_current
                          ? "Present"
                          : formatShortDate(exp.end_date ?? "")}
                      </span>
                    </div>
                    <p className="mb-2 text-sm" style={{ color: accentColor }}>
                      {exp.company}
                    </p>
                    {exp.description && (
                      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 leading-relaxed">
                        {exp.description.split("\n").map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.project && data.project.length > 0 && (
            <section>
              <h2
                className="font-semibold text-sm uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                PROJECTS
              </h2>
              <div className="space-y-4">
                {data.project.map((project) => (
                  <div key={project.name}>
                    <h3 className="mt-3 font-medium text-md text-zinc-800">
                      {project.name}
                    </h3>
                    <p className="mb-1 text-sm" style={{ color: accentColor }}>
                      {project.type}
                    </p>
                    {project.description && (
                      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
                        {project.description.split("\n").map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default MinimalImageTemplate;
