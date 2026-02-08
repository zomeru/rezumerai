"use client";

import { Plus } from "lucide-react";

export interface SectionHeaderProps {
  /** The title of the section */
  title: string;
  /** Callback when add button is clicked */
  onAdd?: () => void;
  /** Custom add button text (defaults to "Add") */
  addButtonText?: string;
  /** Whether to show the add button */
  showAddButton?: boolean;
}

/**
 * Reusable section header component with optional add button
 * Used at the top of form sections in the Resume Builder
 */
export default function SectionHeader({
  title,
  onAdd,
  addButtonText = "Add",
  showAddButton = true,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-lg text-slate-900">{title}</h3>
      {showAddButton && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-600"
        >
          <Plus className="size-4" />
          {addButtonText}
        </button>
      )}
    </div>
  );
}
