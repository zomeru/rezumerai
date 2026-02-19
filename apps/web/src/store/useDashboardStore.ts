import { create } from "zustand";

/**
 * Modal dialog state for dashboard actions.
 *
 * @property type - Type of modal currently open (null if closed)
 * @property resumeId - ID of resume for edit/download modals
 *
 * @example
 * ```ts
 * const modalState: ModalState = {
 *   type: 'edit',
 *   resumeId: 'resume_123'
 * };
 * ```
 */
export interface ModalState {
  type: "create" | "upload" | "edit" | "download" | null;
  resumeId?: string;
}

/**
 * Dashboard view mode for displaying resumes.
 * - "grid": Card grid layout
 * - "list": Vertical list layout
 */
export type ViewMode = "grid" | "list";

/**
 * Zustand store state and actions for dashboard UI controls.
 *
 * @property modalState - Current modal dialog state
 * @property editingTitle - Resume title being edited (for edit modal)
 * @property viewMode - Current display mode (grid or list)
 * @property searchQuery - Resume search filter query
 * @property setModalState - Opens/closes modals with optional resume ID
 * @property setEditingTitle - Updates editing title
 * @property setViewMode - Switches between grid and list views
 * @property setSearchQuery - Updates search filter
 */
interface DashboardStore {
  modalState: ModalState;
  editingTitle: string;
  viewMode: ViewMode;
  searchQuery: string;
  setModalState: (modalState: ModalState) => void;
  setEditingTitle: (title: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
}

/**
 * Global Zustand store for dashboard UI state.
 * Manages modal dialogs, view mode, and search functionality.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const {
 *     modalState,
 *     setModalState,
 *     viewMode,
 *     setViewMode,
 *     searchQuery,
 *     setSearchQuery
 *   } = useDashboardStore();
 *
 *   return (
 *     <>
 *       <SearchBar value={searchQuery} onChange={setSearchQuery} />
 *       <ViewToggle mode={viewMode} onToggle={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} />
 *       <button onClick={() => setModalState({ type: 'create' })}>
 *         Create Resume
 *       </button>
 *       {modalState.type === 'create' && <CreateResumeModal />}
 *     </>
 *   );
 * }
 * ```
 */
export const useDashboardStore = create<DashboardStore>((set) => ({
  modalState: { type: null },
  editingTitle: "",
  viewMode: "grid",
  searchQuery: "",

  setModalState: (modalState: ModalState) => set({ modalState }),
  setEditingTitle: (editingTitle: string) => set({ editingTitle }),
  setViewMode: (viewMode: ViewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
}));
