"use client";

export interface EmptyStateProps {
  /** The message to display when empty */
  message: string;
}

/**
 * Reusable empty state placeholder component
 * Used when a list section has no items
 */
export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border-2 border-slate-300 border-dashed bg-slate-50 p-8 text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
