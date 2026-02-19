import { create } from "zustand";
import type { PreviewMode } from "@/hooks/usePdfGenerator";

/**
 * Zustand store state and actions for resume builder UI controls.
 *
 * @property activeSectionIndex - Currently selected form section index
 * @property removeBackground - Whether to hide resume background in preview
 * @property isSaving - Whether resume is currently being saved
 * @property lastSaved - Timestamp of last successful save
 * @property previewMode - Current preview mode ("html" or "pdf")
 * @property setActiveSectionIndex - Sets active form section
 * @property setRemoveBackground - Toggles background visibility
 * @property setIsSaving - Sets saving state
 * @property setLastSaved - Updates last saved timestamp
 * @property setPreviewMode - Switches between HTML and PDF preview
 */
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

/**
 * Global Zustand store for resume builder UI state.
 * Manages form sections, preview settings, and save status.
 *
 * @example
 * ```tsx
 * function BuilderControls() {
 *   const {
 *     previewMode,
 *     setPreviewMode,
 *     isSaving,
 *     lastSaved
 *   } = useBuilderStore();
 *
 *   return (
 *     <>
 *       <button onClick={() => setPreviewMode('pdf')}>
 *         {previewMode === 'pdf' ? 'Show HTML' : 'Show PDF'}
 *       </button>
 *       {isSaving && <Spinner />}
 *       {lastSaved && <p>Saved at {lastSaved.toLocaleTimeString()}</p>}
 *     </>
 *   );
 * }
 * ```
 */
export const useBuilderStore = create<BuilderStore>((set) => ({
  activeSectionIndex: 0,
  removeBackground: false,
  isSaving: false,
  lastSaved: null,
  previewMode: "html",

  setActiveSectionIndex: (activeSectionIndex: number) => set({ activeSectionIndex }),
  setRemoveBackground: (removeBackground: boolean) => set({ removeBackground }),
  setIsSaving: (isSaving: boolean) => set({ isSaving }),
  setLastSaved: (lastSaved: Date | null) => set({ lastSaved }),
  setPreviewMode: (previewMode: PreviewMode) => set({ previewMode }),
}));
