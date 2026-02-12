import type { Resume } from "@/constants/dummy";

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
  data: Resume;
  accentColor: string;
}

/**
 * Available resume template identifiers.
 * Each template has a unique visual design and layout.
 *
 * - "classic": Traditional professional layout
 * - "modern": Contemporary design with bold accents
 * - "minimal": Clean, content-focused design
 * - "minimal-image": Minimal layout with profile image
 */
export type TemplateType = "classic" | "modern" | "minimal" | "minimal-image";
