/**
 * Error-wrapped versions of risky components.
 * These components are wrapped with ErrorBoundary to prevent cascading failures.
 *
 * Use these wrapped versions in places where component failures shouldn't break the entire page:
 * - Dashboard resume cards (API calls, rendering failures)
 * - PDF preview (heavy rendering, worker failures)
 * - Rich text editor (complex state, third-party library failures)
 * - Form components (validation, state management failures)
 *
 * Each component provides graceful degradation with user-friendly error messages.
 */

import { ErrorBoundary } from "./ErrorBoundary";

/**
 * Fallback UI for failed resume cards.
 * Displays a minimal error state that doesn't break the grid layout.
 */
function ResumeCardFallback() {
  return (
    <div className="flex h-56 w-full items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 p-6">
      <div className="text-center">
        <p className="font-medium text-red-900 text-sm">Unable to load resume</p>
        <p className="mt-1 text-red-700 text-xs">This card could not be displayed</p>
      </div>
    </div>
  );
}

/**
 * Fallback UI for failed PDF preview.
 * Provides retry action without breaking the builder layout.
 */
function PDFPreviewFallback({ reset }: { reset: () => void }) {
  return (
    <div className="flex h-full min-h-150 w-full flex-col items-center justify-center rounded-lg border-2 border-red-200 bg-red-50 p-8">
      <div className="text-center">
        <div className="mb-4 text-5xl">📄</div>
        <h3 className="mb-2 font-semibold text-lg text-red-900">PDF Preview Error</h3>
        <p className="mb-6 text-red-700 text-sm">
          We couldn't generate the PDF preview. This might be due to a temporary issue.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-sm text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Fallback UI for failed form sections.
 * Shows error without breaking the form flow.
 */
function FormSectionFallback({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-amber-900 text-sm">Form Section Error</h3>
          <p className="mb-3 text-amber-800 text-xs">
            This section couldn't be loaded. Your data is safe. Please try refreshing.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white text-xs transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback UI for failed modals.
 * Shows error in modal context without closing the modal.
 */
function ModalFallback({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
      <div className="text-center">
        <div className="mb-3 text-4xl">⚠️</div>
        <h3 className="mb-2 font-semibold text-red-900">Error</h3>
        <p className="mb-4 text-red-700 text-sm">
          This dialog encountered an error. Please try again or close and reopen.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-sm text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/**
 * Safe wrapper for Resume Card components.
 * Catches errors during rendering, API calls, or user interactions.
 */
export function SafeResumeCard({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<ResumeCardFallback />}
      context={{
        component: "ResumeCard",
        action: "render_card",
      }}
      severity="warning"
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Safe wrapper for PDF Preview component.
 * Catches errors from PDF.js, worker failures, or rendering issues.
 */
export function SafePDFPreview({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(_error: Error, reset: () => void) => <PDFPreviewFallback reset={reset} />}
      context={{
        component: "PDFPreview",
        action: "render_pdf",
      }}
      severity="error"
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Safe wrapper for form sections (Experience, Education, etc.).
 * Catches validation errors, state management failures, or rendering issues.
 */
export function SafeFormSection({ children, sectionName }: { children: React.ReactNode; sectionName: string }) {
  return (
    <ErrorBoundary
      fallback={(_error: Error, reset: () => void) => <FormSectionFallback reset={reset} />}
      context={{
        component: "FormSection",
        action: "render_form",
        metadata: { sectionName },
      }}
      severity="warning"
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Safe wrapper for modal components.
 * Catches errors in modal rendering or form submission.
 */
export function SafeModal({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(_error: Error, reset: () => void) => <ModalFallback reset={reset} />}
      context={{
        component: "Modal",
        action: "render_modal",
      }}
      severity="warning"
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Safe wrapper for rich text editor.
 * Catches TipTap initialization failures or editor crashes.
 */
export function SafeRichTextEditor({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(_error: Error, reset: () => void) => (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 font-medium text-amber-900 text-sm">Text editor error</p>
          <p className="mb-3 text-amber-800 text-xs">The rich text editor couldn't load.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded bg-amber-600 px-4 py-2 text-white text-xs hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      )}
      context={{
        component: "RichTextEditor",
        action: "render_editor",
      }}
      severity="warning"
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Safe wrapper for resume preview.
 * Catches template rendering failures or data transformation errors.
 */
export function SafeResumePreview({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(_error: Error, reset: () => void) => (
        <div className="flex h-full min-h-200 items-center justify-center rounded-lg border-2 border-red-200 bg-red-50">
          <div className="text-center">
            <div className="mb-4 text-5xl">📋</div>
            <h3 className="mb-2 font-semibold text-lg text-red-900">Preview Error</h3>
            <p className="mb-4 text-red-700 text-sm">Unable to render resume preview</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-red-600 px-6 py-3 text-sm text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      context={{
        component: "ResumePreview",
        action: "render_preview",
      }}
      severity="error"
    >
      {children}
    </ErrorBoundary>
  );
}
