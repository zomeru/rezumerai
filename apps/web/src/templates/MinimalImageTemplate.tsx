import { formatShortDate } from "@rezumerai/utils/date";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { TemplateProps } from "./types";

const MinimalImageTemplate = ({ data, accentColor }: TemplateProps) => {
  return (
    <div className="mx-auto max-w-5xl bg-white text-zinc-800">
      <div className="grid grid-cols-3">
        <div className="col-span-1 py-10">
          {/* Image */}
          {data.personalInfo?.image && typeof data.personalInfo.image === "string" ? (
            <div className="mb-6">
              <Image
                src={data.personalInfo.image}
                alt="Profile"
                className="mx-auto rounded-full object-cover"
                style={{ background: `${accentColor}70` }}
                width={130}
                height={130}
              />
            </div>
          ) : data.personalInfo?.image && typeof data.personalInfo.image === "object" ? (
            <div className="mb-6">
              <Image
                // src={URL.createObjectURL(data.personalInfo.image)}
                src=""
                alt="Profile"
                className="mx-auto rounded-full object-cover"
                width={130}
                height={130}
              />
            </div>
          ) : null}
        </div>

        {/* Name + Title */}
        <div className="col-span-2 flex flex-col justify-center px-8 py-10">
          <h1 className="font-bold text-4xl text-zinc-700 tracking-widest">
            {data.personalInfo?.fullName || "Your Name"}
          </h1>
          <p className="font-medium text-sm text-zinc-600 uppercase tracking-widest">
            {data?.personalInfo?.profession || "Profession"}
          </p>
        </div>

        {/* Left Sidebar */}
        <aside className="col-span-1 border-zinc-400 border-r p-6 pt-0">
          {/* Contact */}
          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-sm text-zinc-600 tracking-widest">CONTACT</h2>
            <div className="space-y-2 text-sm">
              {data.personalInfo?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: accentColor }} />
                  <span>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} style={{ color: accentColor }} />
                  <span>{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: accentColor }} />
                  <span>{data.personalInfo.location}</span>
                </div>
              )}
            </div>
          </section>

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-semibold text-sm text-zinc-600 tracking-widest">EDUCATION</h2>
              <div className="space-y-4 text-sm">
                {data.education.map((edu) => (
                  <div key={edu?.institution}>
                    <p className="font-semibold uppercase">{edu?.degree}</p>
                    <p className="text-zinc-600">{edu?.institution}</p>
                    <p className="text-xs text-zinc-500">{formatShortDate(edu?.graduationDate ?? "")}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-sm text-zinc-600 tracking-widest">SKILLS</h2>
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
          {data.professionalSummary && (
            <section className="mb-8">
              <h2 className="mb-3 font-semibold text-sm tracking-widest" style={{ color: accentColor }}>
                SUMMARY
              </h2>
              <p className="text-zinc-700 leading-relaxed">{data.professionalSummary}</p>
            </section>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <section>
              <h2 className="mb-4 font-semibold text-sm tracking-widest" style={{ color: accentColor }}>
                EXPERIENCE
              </h2>
              <div className="mb-8 space-y-6">
                {data.experience.map((exp) => (
                  <div key={exp?.company}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-900">{exp?.position}</h3>
                      <span className="text-xs text-zinc-500">
                        {formatShortDate(exp?.start_date ?? "")} -{" "}
                        {exp?.isCurrent ? "Present" : formatShortDate(exp?.end_date ?? "")}
                      </span>
                    </div>
                    <p className="mb-2 text-sm" style={{ color: accentColor }}>
                      {exp?.company}
                    </p>
                    {exp?.description && (
                      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 leading-relaxed">
                        {exp?.description.split("\n").map((line) => (
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
          {data.project && data.project?.length > 0 && (
            <section>
              <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: accentColor }}>
                PROJECTS
              </h2>
              <div className="space-y-4">
                {data.project?.map((project) => (
                  <div key={project?.name}>
                    <h3 className="mt-3 font-medium text-md text-zinc-800">{project?.name}</h3>
                    <p className="mb-1 text-sm" style={{ color: accentColor }}>
                      {project?.type}
                    </p>
                    {project?.description && (
                      <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
                        {project?.description.split("\n").map((line) => (
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
