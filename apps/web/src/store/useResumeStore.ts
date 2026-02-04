import { create } from "zustand";
import { dummyResumeData, type Resume } from "@/constants/dummy";

interface ResumeStore {
  resumes: Resume[];
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumes: dummyResumeData,

  updateResume: (id, updates) =>
    set((state) => ({
      resumes: state.resumes.map((resume) => (resume._id === id ? { ...resume, ...updates } : resume)),
    })),

  deleteResume: (id) =>
    set((state) => ({
      resumes: state.resumes.filter((resume) => resume._id !== id),
    })),
}));
