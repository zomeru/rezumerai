import { ResumeCardSkeletonGrid } from "@rezumerai/ui";

/**
 * Loading state for workspace page.
 * Displays skeleton grid while fetching resume data.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-2 h-10 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-96 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="mb-8">
          <div className="h-12 w-full max-w-md animate-pulse rounded-xl bg-slate-200" />
        </div>

        <ResumeCardSkeletonGrid count={6} />
      </div>
    </div>
  );
}
