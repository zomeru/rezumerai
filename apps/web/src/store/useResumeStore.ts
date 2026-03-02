import type { ResumeWithRelations } from "@rezumerai/types";
import { create } from "zustand";

/**
 * Zustand store for client-side resume state management.
 *
 * IMPORTANT: Server data should be fetched via React Query (useResumeList, useResumeById).
 * This store is for:
 * - Client-side form state in the builder (for non-builder pages)
 * - Legacy support for pages that still use this store
 *
 * @property resumes - Array of resumes
 * @property isLoading - Legacy property for backward compatibility (deprecated)
 * @property hasFetched - Legacy property for backward compatibility (deprecated)
 * @property setResumes - Updates the resume list
 * @property addResume - Adds a resume to the list
 * @property updateResume - Updates a resume in the list (client-side)
 * @property clearResumes - Clears the resume list (useful for logout)
 */
interface ResumeStore {
  resumes: ResumeWithRelations[];
  isLoading: boolean;
  hasFetched: boolean;
  setResumes: (resumes: ResumeWithRelations[]) => void;
  addResume: (resume: ResumeWithRelations) => void;
  updateResume: (id: string, updates: Partial<ResumeWithRelations>) => void;
  clearResumes: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumes: [],
  isLoading: false,
  hasFetched: false,

  setResumes: (resumes: ResumeWithRelations[]): void => set({ resumes, hasFetched: true }),

  addResume: (resume: ResumeWithRelations): void => set((state) => ({ resumes: [...state.resumes, resume] })),

  updateResume: (id: string, updates: Partial<ResumeWithRelations>): void =>
    set((state) => ({
      resumes: state.resumes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  clearResumes: (): void => set({ resumes: [], hasFetched: false }),
}));
