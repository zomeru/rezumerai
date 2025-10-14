import { formatShortDate } from "@rezumerai/utils/date";
import { Mail, MapPin, Phone } from "lucide-react";
import type { TemplateProps } from "./types";

const MinimalImageTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="max-w-5xl mx-auto bg-white text-zinc-800">
      <div className="grid grid-cols-3">
        <div className="col-span-1  py-10">
          {/* Image */}
          {data.personal_info?.image && typeof data.personal_info.image === "string" ? (
            <div className="mb-6">
              <img
                src={data.personal_info.image}
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mx-auto"
                style={{ background: `${accentColor}70` }}
              />
            </div>
          ) : data.personal_info?.image && typeof data.personal_info.image === "object" ? (
            <div className="mb-6">
              <img
                // src={URL.createObjectURL(data.personal_info.image)}
                src=""
                alt="Profile"
                className="w-32 h-32 object-cover rounded-full mx-auto"
              />
            </div>
          ) : null}
        </div>

        {/* Name + Title */}
        <div className="col-span-2 flex flex-col justify-center py-10 px-8">
          <h1 className="text-4xl font-bold text-zinc-700 tracking-widest">
            {data.personal_info?.full_name || "Your Name"}
          </h1>
          <p className="uppercase text-zinc-600 font-medium text-sm tracking-widest">
            {data?.personal_info?.profession || "Profession"}
          </p>
        </div>

        {/* Left Sidebar */}
        <aside className="col-span-1 border-r border-zinc-400 p-6 pt-0">
          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold tracking-widest text-zinc-600 mb-3">CONTACT</h2>
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
              <h2 className="text-sm font-semibold tracking-widest text-zinc-600 mb-3">EDUCATION</h2>
              <div className="space-y-4 text-sm">
                {data.education.map((edu) => (
                  <div key={edu.institution}>
                    <p className="font-semibold uppercase">{edu.degree}</p>
                    <p className="text-zinc-600">{edu.institution}</p>
                    <p className="text-xs text-zinc-500">{formatShortDate(edu.graduation_date)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold tracking-widest text-zinc-600 mb-3">SKILLS</h2>
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
              <h2 className="text-sm font-semibold tracking-widest mb-3" style={{ color: accentColor }}>
                SUMMARY
              </h2>
              <p className="text-zinc-700 leading-relaxed">{data.professional_summary}</p>
            </section>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold tracking-widest mb-4" style={{ color: accentColor }}>
                EXPERIENCE
              </h2>
              <div className="space-y-6 mb-8">
                {data.experience.map((exp) => (
                  <div key={exp.company}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-zinc-900">{exp.position}</h3>
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(exp.start_date)} -{" "}
                        {exp.is_current ? "Present" : formatShortDate(exp.end_date ?? "")}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: accentColor }}>
                      {exp.company}
                    </p>
                    {exp.description && (
                      <ul className="list-disc list-inside text-sm text-zinc-700 leading-relaxed space-y-1">
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
              <h2 className="text-sm uppercase tracking-widest font-semibold" style={{ color: accentColor }}>
                PROJECTS
              </h2>
              <div className="space-y-4">
                {data.project.map((project) => (
                  <div key={project.name}>
                    <h3 className="text-md font-medium text-zinc-800 mt-3">{project.name}</h3>
                    <p className="text-sm mb-1" style={{ color: accentColor }}>
                      {project.type}
                    </p>
                    {project.description && (
                      <ul className="list-disc list-inside text-sm text-zinc-700  space-y-1">
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
