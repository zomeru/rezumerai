import type { StoreApi, UseBoundStore } from "zustand";
import { create } from "zustand";
import { dummyResumeData, type Resume } from "@/constants/dummy";

interface ResumeStore {
  resumes: Resume[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchResumes: () => Promise<void>;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
}

export const useResumeStore: UseBoundStore<StoreApi<ResumeStore>> = create<ResumeStore>((set, get) => ({
  resumes: [],
  isLoading: false,
  hasFetched: false,

  fetchResumes: async (): Promise<void> => {
    if (get().hasFetched) return;
    set({ isLoading: true });
    try {
      // TODO: Replace with actual API call
      set({ resumes: dummyResumeData, hasFetched: true });
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      set({ isLoading: false });
    }
  },

  updateResume: (id: string, updates: Partial<Resume>): void =>
    set((state) => ({
      resumes: state.resumes.map((resume) => (resume._id === id ? { ...resume, ...updates } : resume)),
    })),

  deleteResume: (id: string): void =>
    set((state) => ({
      resumes: state.resumes.filter((resume) => resume._id !== id),
    })),
}));
