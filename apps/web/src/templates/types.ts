import type { ResumeWithRelations } from "@rezumerai/types";

/**
 * Props interface for resume template components.
 * All template components (Classic, Modern, Minimal, etc.) accept these props.
 *
 * @property data - Complete resume data to render
 * @property accentColor - Hex color code for template accent elements
 *
 * @example
 * ```tsx
 * <ClassicTemplate
 *   data={resumeData}
 *   accentColor="#3b82f6"
 * />
 * ```
 */
export interface TemplateProps {
  data: ResumeWithRelations;
  accentColor: string;
}

export type ExperienceTemplateItem = ResumeWithRelations["experience"][number];
export type ProjectTemplateItem = ResumeWithRelations["project"][number];
export type EducationTemplateItem = ResumeWithRelations["education"][number];
export type SkillTemplateItem = ResumeWithRelations["skills"][number];

/**
 * Available resume template identifiers.
 * Each template has a unique visual design and layout.
 *
 * - "classic": Traditional professional layout
 * - "modern": Contemporary design with bold accents
 * - "minimal": Clean, content-focused design
 * - "minimal_image": Minimal layout with profile image
 */
export type TemplateType = ResumeWithRelations["template"];
