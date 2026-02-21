/**
 * Lazy-loaded Resume Builder components.
 * Reduces initial bundle size by splitting heavy components into separate chunks.
 *
 * Components included:
 * - PDFPreview: Heavy PDF rendering library (react-pdf)
 * - RichTextEditor: TipTap editor with extensions
 * - ColorPickerModal: Color picker with portal rendering
 * - TemplateSelector: Template selection UI
 *
 * Usage:
 * Import from this file instead of direct imports to get lazy-loaded versions:
 * ```tsx
 * import { LazyPDFPreview, LazyRichTextEditor } from './LazyComponents';
 * ```
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";
import {
  ColorPickerSkeleton,
  PDFPreviewSkeleton,
  RichTextEditorSkeleton,
  TemplateSelectorSkeleton,
} from "./LoadingSkeletons";

/**
 * Lazy-loaded PDFPreview component.
 * Heavy component due to react-pdf library and PDF.js worker.
 * Only loads when user navigates to preview section.
 */
const PDFPreviewDynamic = dynamic(() => import("./PDFPreview"), {
  loading: () => <PDFPreviewSkeleton />,
  ssr: false, // Disable SSR due to PDF.js worker requirements
});

/**
 * Lazy-loaded RichTextEditor component.
 * Heavy component due to TipTap editor and extensions.
 * Only loads when user focuses on rich text fields.
 */
const RichTextEditorDynamic = dynamic(() => import("./RichTextEditor"), {
  loading: () => <RichTextEditorSkeleton />,
  ssr: false, // Disable SSR for better hydration performance
});

/**
 * Lazy-loaded ColorPickerModal component.
 * Includes react-colorful library and portal rendering.
 * Only loads when color picker is opened.
 */
const ColorPickerModalDynamic = dynamic(() => import("./ColorPickerModal"), {
  loading: () => <ColorPickerSkeleton />,
  ssr: false, // Disable SSR due to portal rendering
});

/**
 * Lazy-loaded TemplateSelector component.
 * Includes template preview images and selection logic.
 * Loads immediately but can be deferred if needed.
 */
const TemplateSelectorDynamic = dynamic(() => import("./TemplateSelector"), {
  loading: () => <TemplateSelectorSkeleton />,
});

/**
 * Wrapped lazy components with Suspense boundaries for better error handling.
 * These components provide automatic fallback to skeleton loaders.
 */

export function LazyPDFPreview(props: React.ComponentProps<typeof PDFPreviewDynamic>) {
  return (
    <Suspense fallback={<PDFPreviewSkeleton />}>
      <PDFPreviewDynamic {...props} />
    </Suspense>
  );
}

export function LazyRichTextEditor(props: React.ComponentProps<typeof RichTextEditorDynamic>) {
  return (
    <Suspense fallback={<RichTextEditorSkeleton />}>
      <RichTextEditorDynamic {...props} />
    </Suspense>
  );
}

export function LazyColorPickerModal(props: React.ComponentProps<typeof ColorPickerModalDynamic>) {
  return (
    <Suspense fallback={<ColorPickerSkeleton />}>
      <ColorPickerModalDynamic {...props} />
    </Suspense>
  );
}

export function LazyTemplateSelector(props: React.ComponentProps<typeof TemplateSelectorDynamic>) {
  return (
    <Suspense fallback={<TemplateSelectorSkeleton />}>
      <TemplateSelectorDynamic {...props} />
    </Suspense>
  );
}

/**
 * Export individual dynamic components for direct use without Suspense wrapper.
 * Use these when you want to provide custom Suspense boundaries.
 */
export { PDFPreviewDynamic, RichTextEditorDynamic, ColorPickerModalDynamic, TemplateSelectorDynamic };
