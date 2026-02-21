import Skeleton, { SkeletonText } from "./Skeleton";

/**
 * Skeleton placeholder matching the ResumeCard layout.
 * Renders the same h-56 rounded card with pulsing placeholders
 * for the icon, title, date, and action area.
 */
export default function ResumeCardSkeleton() {
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

/**
 * Props for ResumeCardSkeletonGrid component.
 *
 * @property count - Number of skeleton cards to render (default: 5)
 */
interface ResumeCardSkeletonGridProps {
  count?: number;
}

/**
 * Renders a responsive grid of ResumeCardSkeleton placeholders.
 * Grid adapts from 2 columns on mobile to 5 columns on extra-large screens.
 *
 * @param props - Grid configuration
 * @returns Grid layout of skeleton cards
 *
 * @example
 * ```tsx
 * <ResumeCardSkeletonGrid count={8} />
 * <ResumeCardSkeletonGrid /> // defaults to 5 cards
 * ```
 */
export function ResumeCardSkeletonGrid({ count = 5 }: ResumeCardSkeletonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable id
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Props for ResumeCardSkeletonList component.
 *
 * @property count - Number of skeleton cards to render (default: 5)
 */
interface ResumeCardSkeletonListProps {
  count?: number;
}

/**
 * Renders a vertical list of ResumeCardSkeleton placeholders.
 * Optimized for list view mode with vertical spacing.
 *
 * @param props - List configuration
 * @returns Vertical list of skeleton cards
 *
 * @example
 * ```tsx
 * <ResumeCardSkeletonList count={3} />
 * <ResumeCardSkeletonList /> // defaults to 5 cards
 * ```
 */
export function ResumeCardSkeletonList({ count = 5 }: ResumeCardSkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items have no stable id
        <ResumeCardSkeleton key={i} />
      ))}
    </div>
  );
}
