import type { StoreApi, UseBoundStore } from "zustand";
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

export const useBuilderStore: UseBoundStore<StoreApi<BuilderStore>> = create<BuilderStore>((set) => ({
  activeSectionIndex: 0,
  removeBackground: false,
  isSaving: false,
  lastSaved: null,
  previewMode: "html",

  setActiveSectionIndex: (activeSectionIndex: number): void => set({ activeSectionIndex }),
  setRemoveBackground: (removeBackground: boolean): void => set({ removeBackground }),
  setIsSaving: (isSaving: boolean): void => set({ isSaving }),
  setLastSaved: (lastSaved: Date | null): void => set({ lastSaved }),
  setPreviewMode: (previewMode: PreviewMode): void => set({ previewMode }),
}));
