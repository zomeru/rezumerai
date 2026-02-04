import { create } from "zustand";

export interface ModalState {
  type: "create" | "upload" | "edit" | "download" | null;
  resumeId?: string;
}

export type ViewMode = "grid" | "list";

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

export const useDashboardStore = create<DashboardStore>((set) => ({
  modalState: { type: null },
  editingTitle: "",
  viewMode: "grid",
  searchQuery: "",

  setModalState: (modalState) => set({ modalState }),
  setEditingTitle: (editingTitle) => set({ editingTitle }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
