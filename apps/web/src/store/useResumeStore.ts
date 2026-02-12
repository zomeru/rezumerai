import type { StoreApi, UseBoundStore } from "zustand";
import { create } from "zustand";
import { dummyResumeData, type Resume } from "@/constants/dummy";

/**
 * Zustand store state and actions for resume CRUD operations.
 *
 * @property resumes - Array of all user resumes
 * @property isLoading - Whether resumes are currently being fetched
 * @property hasFetched - Whether initial fetch has completed (prevents refetch)
 * @property fetchResumes - Fetches all user resumes from API
 * @property updateResume - Updates a specific resume by ID
 * @property deleteResume - Removes a resume by ID
 */
interface ResumeStore {
  resumes: Resume[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchResumes: () => Promise<void>;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
}

/**
 * Global Zustand store for managing resume data.
 * Handles CRUD operations for resume documents across the application.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { resumes, fetchResumes, updateResume, deleteResume } = useResumeStore();
 *
 *   useEffect(() => {
 *     fetchResumes();
 *   }, [fetchResumes]);
 *
 *   return (
 *     <>
 *       {resumes.map(resume => (
 *         <ResumeCard
 *           key={resume._id}
 *           resume={resume}
 *           onUpdate={(updates) => updateResume(resume._id, updates)}
 *           onDelete={() => deleteResume(resume._id)}
 *         />
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
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
