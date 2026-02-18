import type { TemplateType } from "@/templates";

/**
 * Available resume template configurations.
 * Defines metadata for all selectable resume templates.
 *
 * @property id - Unique template identifier matching TemplateType
 * @property name - Display name shown in template selector
 * @property preview - Description text explaining template style
 *
 * @example
 * ```tsx
 * {TEMPLATES.map(template => (
 *   <TemplateCard key={template.id} {...template} />
 * ))}
 * ```
 */
export const TEMPLATES: { id: TemplateType; name: string; preview: string }[] = [
  {
    id: "classic",
    name: "Classic",
    preview: "A timeless resume layout with well-defined sections and professional typography.",
  },
  {
    id: "modern",
    name: "Modern",
    preview: "A sleek, contemporary design featuring bold accents and clean font choices.",
  },
  {
    id: "minimal_image",
    name: "Minimal with Image",
    preview: "A refined, minimal layout that highlights your profile image and key details.",
  },
  {
    id: "minimal",
    name: "Minimal",
    preview: "An ultra-clean, content-focused design that keeps the spotlight on your achievements.",
  },
];
