/**
 * Loading skeleton components for lazy-loaded Resume Builder components.
 * Provides accessible, visually consistent loading states during code-splitting.
 *
 * Features:
 * - Pulse animations
 * - Proper ARIA labels
 * - Matching dimensions to actual components
 * - Screen reader announcements
 */

/**
 * Skeleton for PDFPreview component.
 * Matches the dimensions and layout of the actual PDF viewer.
 */
export function PDFPreviewSkeleton() {
  return (
    <output
      className="flex h-full min-h-150 w-full flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
      aria-label="Loading PDF preview"
    >
      <div className="flex flex-col items-center gap-4">
        {/* PDF icon skeleton */}
        <div className="h-16 w-16 animate-pulse rounded-lg bg-slate-300" />

        {/* Loading text */}
        <div className="space-y-2 text-center">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-300" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        </div>

        {/* Progress indicator */}
        <div className="h-1 w-64 animate-pulse rounded-full bg-slate-300" />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading PDF preview, please wait...</span>
    </output>
  );
}

/**
 * Skeleton for RichTextEditor component.
 * Matches the toolbar and editor layout.
 */
export function RichTextEditorSkeleton() {
  return (
    <output className="block w-full space-y-2" aria-label="Loading rich text editor">
      {/* Toolbar skeleton */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
        {Array.from({ length: 12 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list, no reordering occurs
          <div key={i} className="h-8 w-8 animate-pulse rounded bg-slate-300" />
        ))}
      </div>

      {/* Editor content skeleton */}
      <div className="min-h-50 rounded-lg border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading text editor, please wait...</span>
    </output>
  );
}

/**
 * Skeleton for ColorPickerModal component.
 * Shows a simple button skeleton.
 */
export function ColorPickerSkeleton() {
  return (
    <output className="block h-10 w-10 animate-pulse rounded-lg bg-slate-300" aria-label="Loading color picker">
      <span className="sr-only">Loading color picker...</span>
    </output>
  );
}

/**
 * Skeleton for TemplateSelector component.
 * Shows a button skeleton matching the selector button.
 */
export function TemplateSelectorSkeleton() {
  return (
    <output className="block h-10 w-28 animate-pulse rounded-lg bg-slate-300" aria-label="Loading template selector">
      <span className="sr-only">Loading template selector...</span>
    </output>
  );
}

/**
 * Generic skeleton for form sections.
 * Used as fallback for lazy-loaded form components.
 */
export function FormSkeleton() {
  return (
    <output className="block space-y-4 rounded-lg border border-slate-200 bg-white p-6" aria-label="Loading form">
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-300" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-300" />
        <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-300" />
        <div className="h-24 w-full animate-pulse rounded bg-slate-200" />
      </div>
      <span className="sr-only">Loading form, please wait...</span>
    </output>
  );
}

/**
 * Skeleton for resume preview.
 * Shows a document-like loading state.
 */
export function ResumePreviewSkeleton() {
  return (
    <output
      className="flex h-full min-h-200 w-full items-center justify-center rounded-lg border-2 border-slate-300 border-dashed bg-slate-50"
      aria-label="Loading resume preview"
    >
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <svg
          className="h-16 w-16 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div className="text-center">
          <p className="font-medium text-sm">Loading preview...</p>
          <p className="text-xs">This may take a moment</p>
        </div>
      </div>
      <span className="sr-only">Loading resume preview, please wait...</span>
    </output>
  );
}
