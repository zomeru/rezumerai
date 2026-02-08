import Skeleton, { SkeletonText } from "./Skeleton";

/**
 * Skeleton placeholder for the Resume Builder page.
 * Mirrors the two-column layout: left editor panel + right preview panel.
 * Only the data-dependent areas pulse; structural chrome (back link, headers) is omitted.
 */
export default function ResumeBuilderSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12">
      {/* Left Panel – Editor skeleton */}
      <div className="w-full lg:col-span-5">
        <div className="space-y-6">
          {/* Controls Card skeleton */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
            {/* Controls bar */}
            <div className="flex items-center justify-between border-slate-100 border-b bg-linear-to-br from-slate-50 to-white p-4">
              <div className="flex items-center gap-2">
                <Skeleton width={100} height={36} borderRadius={8} />
                <Skeleton width={36} height={36} borderRadius={8} />
                <Skeleton width={100} height={36} borderRadius={8} />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton width={36} height={36} borderRadius={8} />
                <Skeleton width={36} height={36} borderRadius={8} />
              </div>
            </div>

            {/* Progress bar placeholder */}
            <div className="h-1.5 w-full bg-slate-100">
              <Skeleton width="30%" height={6} borderRadius={0} className="bg-slate-200!" />
            </div>

            {/* Section steps */}
            <div className="flex items-center justify-center gap-2 border-slate-100 border-b p-4">
              {Array.from({ length: 6 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
                <Skeleton key={i} width={40} height={40} borderRadius={12} />
              ))}
            </div>

            {/* Form content placeholder */}
            <div className="space-y-5 p-6">
              {/* Section heading */}
              <div className="space-y-2">
                <Skeleton width="50%" height={24} borderRadius={6} />
                <SkeletonText width="70%" />
              </div>

              {/* Form fields */}
              {Array.from({ length: 4 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
                <div key={i} className="space-y-2">
                  <Skeleton width={80} height={14} borderRadius={4} />
                  <Skeleton width="100%" height={40} borderRadius={8} />
                </div>
              ))}
            </div>
          </div>

          {/* Save button skeleton */}
          <Skeleton width="100%" height={56} borderRadius={12} />
        </div>
      </div>

      {/* Right Panel – Preview skeleton */}
      <div className="w-full lg:col-span-7">
        <div className="space-y-4">
          {/* Action buttons row */}
          <div className="flex items-center justify-between">
            <Skeleton width={180} height={40} borderRadius={12} />
            <div className="flex items-center gap-2">
              <Skeleton width={100} height={40} borderRadius={12} />
              <Skeleton width={140} height={40} borderRadius={12} />
            </div>
          </div>

          {/* Resume preview placeholder (A4-ish ratio) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xl">
            <div className="space-y-6 p-8">
              {/* Header area */}
              <div className="flex items-center gap-4">
                <Skeleton width={80} height={80} borderRadius="50%" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" height={28} borderRadius={6} />
                  <SkeletonText width="40%" />
                  <SkeletonText width="50%" />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Skeleton width={120} height={18} borderRadius={4} />
                <SkeletonText />
                <SkeletonText />
                <SkeletonText width="80%" />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Skeleton width={120} height={18} borderRadius={4} />
                <Skeleton width="70%" height={16} borderRadius={4} />
                <SkeletonText />
                <SkeletonText />
                <SkeletonText width="60%" />
              </div>

              {/* Education */}
              <div className="space-y-2">
                <Skeleton width={100} height={18} borderRadius={4} />
                <Skeleton width="65%" height={16} borderRadius={4} />
                <SkeletonText width="45%" />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Skeleton width={60} height={18} borderRadius={4} />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
                    <Skeleton key={i} width={80} height={28} borderRadius={14} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
