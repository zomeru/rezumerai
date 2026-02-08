import Skeleton, { SkeletonText } from "./Skeleton";

/**
 * Skeleton placeholder matching the ResumeCard layout.
 * Renders the same h-56 rounded card with pulsing placeholders
 * for the icon, title, date, and action area.
 */
export default function ResumeCardSkeleton(): React.JSX.Element {
  return (
    <div className="relative flex h-56 w-full flex-col overflow-hidden rounded-2xl border-2 border-slate-200/60 bg-white p-6 shadow-sm">
      {/* Icon placeholder */}
      <div className="mb-4 flex items-start justify-between">
        <Skeleton width={48} height={48} borderRadius={12} />
      </div>

      {/* Title placeholder */}
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" height={20} borderRadius={6} />
        <SkeletonText width="40%" />
      </div>

      {/* Bottom "Open" area placeholder */}
      <div className="mt-4">
        <Skeleton width={60} height={14} borderRadius={6} />
      </div>
    </div>
  );
}

interface ResumeCardSkeletonGridProps {
  count?: number;
}

/** Renders a grid of ResumeCardSkeleton placeholders */
export function ResumeCardSkeletonGrid({ count = 5 }: ResumeCardSkeletonGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable id
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
}

interface ResumeCardSkeletonListProps {
  count?: number;
}

/** Renders a list of skeleton rows for list view mode */
export function ResumeCardSkeletonList({ count = 5 }: ResumeCardSkeletonListProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable id
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
}
