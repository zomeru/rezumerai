import { ResumeBuilderSkeleton } from "@rezumerai/ui";

/**
 * Loading state for resume builder page.
 * Displays skeleton while fetching resume data.
 */
export default function Loading(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-linear-to-br from-slate-50 to-slate-100">
      <div className="border-slate-200/60 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-400 px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-400 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <ResumeBuilderSkeleton />
      </div>
    </div>
  );
}
