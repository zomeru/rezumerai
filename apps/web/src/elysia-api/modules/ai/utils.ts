import type { AssistantReplyBlock, ResumeSection, ResumeSectionTarget } from "@rezumerai/types";
import type { Static } from "elysia";
import type { z } from "zod";

const htmlEntityMap: Record<string, string> = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|ul|ol|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|nbsp|lt|gt|quot|#39);/gi, (match) => htmlEntityMap[match.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactText(value: string, maxLength: number): string {
  const normalized = stripHtml(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function compactMultilineText(value: string, maxLength: number): string {
  const normalized = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|ul|ol|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|nbsp|lt|gt|quot|#39);/gi, (match) => htmlEntityMap[match.toLowerCase()] ?? " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(\*\*[A-Z][^*\n]{0,80}:\*\*)/g, "\n\n$1")
    .replace(/[ \t]+(\d+\.\s+)/g, "\n$1")
    .replace(/[ \t]+([-*]\s+)/g, "\n$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function formatAssistantReply(value: string, maxLength: number): string {
  const normalized = compactMultilineText(value, maxLength)
    .replace(/([^\n])([ \t]+)(\*\*[^*\n]{1,80}:\*\*)/g, "$1\n\n$3")
    .replace(/(\*\*[^*\n]{1,80}:\*\*)([ \t]+)([-*]|\d+\.)/g, "$1\n$3")
    .replace(/([^\n])([ \t]+)((?:[-*•]|\d+\.)\s+)/g, "$1\n$3")
    .replace(
      /((?:^|\n)(?:[-*•]|\d+\.)[^\n]+)([ \t]+)(Your current|Current selection|Selected model|Only |Showing |Note:)/gm,
      "$1\n\n$3",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function parseAssistantReplyBlocks(content: string): AssistantReplyBlock[] {
  const lines = content.split("\n").map((line) => line.trim());
  const blocks: AssistantReplyBlock[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph(): void {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join("\n").trim(),
    });
    paragraphLines = [];
  }

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];

    if (!line) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\d+\.\s+/, "").trim());
        index += 1;
      }

      blocks.push({
        type: "ordered-list",
        items,
      });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (index < lines.length && /^[-*•]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^[-*•]\s+/, "").trim());
        index += 1;
      }

      blocks.push({
        type: "unordered-list",
        items,
      });
      continue;
    }

    paragraphLines.push(line);
    index += 1;
  }

  flushParagraph();
  return blocks;
}

export function slugifyForSearch(value: string): string {
  return stripHtml(value).toLowerCase();
}

export function tokenize(value: string): string[] {
  return slugifyForSearch(value)
    .split(/[^a-z0-9+#./-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

export function uniqueTokens(value: string): string[] {
  return [...new Set(tokenize(value))];
}

export function toJsonText(value: unknown): string {
  return JSON.stringify(value);
}

export function parseJsonResponse<T>(value: string, schema: z.ZodType<T>): T {
  const trimmed = value.trim();
  const candidate = trimmed.startsWith("{") || trimmed.startsWith("[") ? trimmed : extractJsonBlock(trimmed);

  return schema.parse(JSON.parse(candidate));
}

function extractJsonBlock(value: string): string {
  const objectStart = value.indexOf("{");
  const arrayStart = value.indexOf("[");
  const start = objectStart === -1 ? arrayStart : arrayStart === -1 ? objectStart : Math.min(objectStart, arrayStart);

  if (start === -1) {
    throw new Error("Model did not return JSON.");
  }

  return value.slice(start);
}

type ResumeSchema = typeof import("@rezumerai/database/generated/prismabox/Resume")["Resume"];
type ResumeWithRelations = Omit<Static<ResumeSchema>, "user">;

export function buildResumeHeadline(resume: ResumeWithRelations): string {
  const fullName = resume.personalInfo?.fullName?.trim();
  const profession = resume.personalInfo?.profession?.trim();
  const title = resume.title?.trim();

  return [fullName, profession || title].filter(Boolean).join(" - ");
}

export function resolveSectionLabel(section: ResumeSection): string {
  const labels: Record<ResumeSection, string> = {
    professionalSummary: "Professional Summary",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    project: "Projects",
  };

  return labels[section];
}

export function getResumeSectionSource(
  resume: ResumeWithRelations,
  target: ResumeSectionTarget,
): {
  target: ResumeSectionTarget;
  label: string;
  itemLabel: string | null;
  originalText: string;
  metadata: Record<string, string | string[] | null>;
} {
  if (target.section === "professionalSummary") {
    return {
      target,
      label: resolveSectionLabel(target.section),
      itemLabel: null,
      originalText: stripHtml(resume.professionalSummary ?? ""),
      metadata: {},
    };
  }

  if (target.section === "skills") {
    return {
      target,
      label: resolveSectionLabel(target.section),
      itemLabel: null,
      originalText: (resume.skills ?? []).join(", "),
      metadata: { count: String(resume.skills?.length ?? 0) },
    };
  }

  if (target.section === "experience") {
    const item = resume.experience.find(
      (entry: ResumeWithRelations["experience"][number]) => entry.id === target.itemId,
    );
    if (!item) {
      throw new Error("Requested experience item was not found.");
    }

    return {
      target,
      label: resolveSectionLabel(target.section),
      itemLabel: `${item.position || "Role"} @ ${item.company || "Company"}`,
      originalText: stripHtml(item.description ?? ""),
      metadata: {
        heading: `${item.position || ""} ${item.company ? `at ${item.company}` : ""}`.trim(),
        startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
        endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
      },
    };
  }

  if (target.section === "education") {
    const item = resume.education.find((entry: ResumeWithRelations["education"][number]) => entry.id === target.itemId);
    if (!item) {
      throw new Error("Requested education item was not found.");
    }

    return {
      target,
      label: resolveSectionLabel(target.section),
      itemLabel: `${item.degree || "Degree"} @ ${item.institution || "Institution"}`,
      originalText: [item.degree, item.field, item.institution].filter(Boolean).join(" - "),
      metadata: {
        degree: item.degree || null,
        institution: item.institution || null,
      },
    };
  }

  const item = resume.project.find((entry: ResumeWithRelations["project"][number]) => entry.id === target.itemId);
  if (!item) {
    throw new Error("Requested project item was not found.");
  }

  return {
    target,
    label: resolveSectionLabel(target.section),
    itemLabel: item.name || "Project",
    originalText: stripHtml(item.description ?? ""),
    metadata: {
      name: item.name || null,
      type: item.type || null,
    },
  };
}

export function buildResumeSnapshot(resume: ResumeWithRelations): {
  headline: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
} {
  return {
    headline: buildResumeHeadline(resume),
    summary: compactText(resume.professionalSummary ?? "", 600),
    skills: (resume.skills ?? []).slice(0, 24),
    experience: resume.experience.map((item: ResumeWithRelations["experience"][number]) =>
      compactText(
        `${item.position || "Role"} @ ${item.company || "Company"}: ${stripHtml(item.description ?? "")}`,
        220,
      ),
    ),
    education: resume.education.map((item: ResumeWithRelations["education"][number]) =>
      compactText(`${item.degree || "Degree"} - ${item.institution || "Institution"} ${item.field || ""}`, 180),
    ),
    projects: resume.project.map((item: ResumeWithRelations["project"][number]) =>
      compactText(`${item.name || "Project"}: ${stripHtml(item.description ?? "")}`, 180),
    ),
  };
}

export function analyzeJobDescriptionText(text: string): {
  title: string | null;
  priorities: string[];
  keywords: string[];
} {
  const lines = stripHtml(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? "";
  const title = firstLine.length > 5 && firstLine.length < 120 ? firstLine : null;
  const keywords = uniqueTokens(text).slice(0, 30);
  const priorities = keywords
    .filter((token) => token.length > 4)
    .slice(0, 8)
    .map((token) => token.replace(/[-_/]+/g, " "));

  return { title, priorities, keywords };
}

export function matchResumeSnapshotToJob(
  snapshot: ReturnType<typeof buildResumeSnapshot>,
  analysis: ReturnType<typeof analyzeJobDescriptionText>,
): {
  matches: string[];
  gaps: string[];
} {
  const haystack = slugifyForSearch(
    [
      snapshot.headline,
      snapshot.summary,
      snapshot.skills.join(" "),
      snapshot.experience.join(" "),
      snapshot.education.join(" "),
      snapshot.projects.join(" "),
    ].join(" "),
  );

  const matches = analysis.keywords.filter((keyword) => haystack.includes(keyword)).slice(0, 8);
  const gaps = analysis.keywords.filter((keyword) => !haystack.includes(keyword)).slice(0, 8);

  return {
    matches: matches.map((keyword) => keyword.replace(/[-_/]+/g, " ")),
    gaps: gaps.map((keyword) => keyword.replace(/[-_/]+/g, " ")),
  };
}

export function buildDraftPatch(target: ResumeSectionTarget, suggestion: string): Record<string, unknown> {
  if (target.section === "professionalSummary") {
    return { professionalSummary: suggestion };
  }

  if (target.section === "skills") {
    return {
      skills: suggestion
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  const key = target.section;

  return {
    [key]: [
      {
        id: target.itemId,
        ...(target.section === "education"
          ? { degree: suggestion }
          : target.section === "project"
            ? { description: suggestion }
            : { description: suggestion }),
      },
    ],
  };
}
