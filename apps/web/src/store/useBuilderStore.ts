import { create } from "zustand";
import type { PreviewMode } from "@/hooks/usePdfGenerator";

interface BuilderStore {
  activeSectionIndex: number;
  removeBackground: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  previewMode: PreviewMode;
  setActiveSectionIndex: (index: number) => void;
  setRemoveBackground: (remove: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  setPreviewMode: (mode: PreviewMode) => void;
}

export const useBuilderStore = create<BuilderStore>((set) => ({
  activeSectionIndex: 0,
  removeBackground: false,
  isSaving: false,
  lastSaved: null,
  previewMode: "html",

  setActiveSectionIndex: (activeSectionIndex) => set({ activeSectionIndex }),
  setRemoveBackground: (removeBackground) => set({ removeBackground }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved }),
  setPreviewMode: (previewMode) => set({ previewMode }),
}));
