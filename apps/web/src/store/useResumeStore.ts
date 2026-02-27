import type { ResumeWithRelations } from "@rezumerai/types";
import { create } from "zustand";
import { api } from "@/lib/api";

/**
 * Zustand store state and actions for resume CRUD operations.
 *
 * @property resumes - Array of all user resumes
 * @property isLoading - Whether resumes are currently being fetched
 * @property hasFetched - Whether initial fetch has completed (prevents refetch)
 * @property fetchResumes - Fetches all user resumes from API; pass force=true to bypass cache
 * @property addResume - Appends a new resume to the list (use after successful create)
 * @property updateResume - Updates a specific resume by ID (client-side optimistic update)
 * @property deleteResume - Deletes a resume via API then removes it from the store
 */
interface ResumeStore {
  resumes: ResumeWithRelations[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchResumes: (force?: boolean) => Promise<void>;
  addResume: (resume: ResumeWithRelations) => void;
  updateResume: (id: string, updates: Partial<ResumeWithRelations>) => void;
  deleteResume: (id: string) => Promise<void>;
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

  addResume: (resume: ResumeWithRelations): void => set((state) => ({ resumes: [...state.resumes, resume] })),

  updateResume: (id: string, updates: Partial<ResumeWithRelations>): void =>
    set((state) => ({
      resumes: state.resumes.map((resume) => (resume.id === id ? { ...resume, ...updates } : resume)),
    })),

  deleteResume: async (id: string): Promise<void> => {
    const { data, error } = await api.resumes({ id }).delete();
    if (error || !data?.success) return;
    set((state) => ({
      resumes: state.resumes.filter((resume) => resume.id !== id),
    }));
  },
}));
