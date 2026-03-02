import type { ResumeWithRelations } from "@rezumerai/types";
import { create } from "zustand";
import { api } from "@/lib/api";

/**
 * Zustand store for client-side resume state management.
 *
 * IMPORTANT: Server data should be fetched via React Query (useResumeList, useResumeById).
 * This store is for:
 * - Synced resume data from React Query (for quick access without re-fetching)
 * - Client-side form state in the builder
 *
 * @property resumes - Array of resumes (synced from React Query)
 * @property isLoading - Legacy property for backward compatibility (deprecated)
 * @property hasFetched - Legacy property for backward compatibility (deprecated)
 * @property fetchResumes - Fetches resumes from API (legacy, prefer useResumeList)
 * @property setResumes - Updates the resume list (called after React Query fetch)
 * @property addResume - Adds a resume to the list
 * @property updateResume - Updates a resume in the list (client-side)
 * @property clearResumes - Clears the resume list (useful for logout)
 */
interface ResumeStore {
  resumes: ResumeWithRelations[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchResumes: (force?: boolean) => Promise<void>;
  setResumes: (resumes: ResumeWithRelations[]) => void;
  addResume: (resume: ResumeWithRelations) => void;
  updateResume: (id: string, updates: Partial<ResumeWithRelations>) => void;
  clearResumes: () => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resumes: [],
  isLoading: false,
  hasFetched: false,

  fetchResumes: async (force = false): Promise<void> => {
    if (get().hasFetched && !force) return;
    set({ isLoading: true });
    try {
      const { data } = await api.resumes.get();
      if (data && "data" in data && data.data) {
        set({ resumes: data.data as ResumeWithRelations[], hasFetched: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setResumes: (resumes: ResumeWithRelations[]): void => set({ resumes, hasFetched: true }),

  addResume: (resume: ResumeWithRelations): void => set((state) => ({ resumes: [...state.resumes, resume] })),

  updateResume: (id: string, updates: Partial<ResumeWithRelations>): void =>
    set((state) => ({
      resumes: state.resumes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  clearResumes: (): void => set({ resumes: [], hasFetched: false }),
}));
