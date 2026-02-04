import type { TemplateType } from "@/templates";

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
    id: "minimal-image",
    name: "Minimal with Image",
    preview: "A refined, minimal layout that highlights your profile image and key details.",
  },
  {
    id: "minimal",
    name: "Minimal",
    preview: "An ultra-clean, content-focused design that keeps the spotlight on your achievements.",
  },
];
