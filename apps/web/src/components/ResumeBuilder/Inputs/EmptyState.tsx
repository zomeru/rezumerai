"use client";

export interface EmptyStateProps {
  /** The message to display when empty */
  message: string;
}

/**
 * Reusable empty state placeholder with dashed border.
 * Displayed when a list section has no items.
 *
 * @param props - Empty state configuration
 * @returns Centered placeholder message in a dashed border box
 *
 * @example
 * ```tsx
 * {items.length === 0 && <EmptyState message="No experience entries yet" />}
 * ```
 */
export default function EmptyState({ message }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-8 text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
