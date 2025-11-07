import type { ResumeData } from "@/constants/dummy";

export interface TemplateProps {
  data: ResumeData;
  accentColor: string;
}

export type TemplateType = "classic" | "modern" | "minimal" | "minimal-image";
