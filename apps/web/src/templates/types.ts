import type { Resume } from "@/constants/dummy";

export interface TemplateProps {
  data: Resume;
  accentColor: string;
}

export type TemplateType = "classic" | "modern" | "minimal" | "minimal-image";
