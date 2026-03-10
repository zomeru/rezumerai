import type { LucideIcon } from "lucide-react";
import { Briefcase, FileText, FolderIcon, GraduationCap, Sparkles, User } from "lucide-react";

export type ResumeBuilderSectionId = "personal" | "summary" | "experience" | "education" | "projects" | "skills";

export interface ResumeBuilderSection {
  id: ResumeBuilderSectionId;
  name: string;
  icon: LucideIcon;
}

export const RESUME_BUILDER_SECTIONS: ResumeBuilderSection[] = [
  { id: "personal", name: "Personal Information", icon: User },
  { id: "summary", name: "Summary", icon: FileText },
  { id: "experience", name: "Experience", icon: Briefcase },
  { id: "education", name: "Education", icon: GraduationCap },
  { id: "projects", name: "Projects", icon: FolderIcon },
  { id: "skills", name: "Skills", icon: Sparkles },
];
