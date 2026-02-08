"use client";

import { Trash2 } from "lucide-react";

export interface DeleteButtonProps {
  /** Callback when delete is triggered */
  onDelete: () => void;
  /** Accessible label for the button */
  ariaLabel?: string;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * Reusable delete button component with keyboard accessibility
 * Used in list items to remove entries
 */
export default function DeleteButton({
  onDelete,
  ariaLabel = "Delete item",
  size = "md",
}: DeleteButtonProps): React.JSX.Element {
  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete();
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      onDelete();
    }
  };

  const sizeClasses = size === "sm" ? "p-1" : "p-1.5";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    // biome-ignore lint/a11y/useSemanticElements: Intentionally using span with role=button to work inside button parents
    <span
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={`ml-2 cursor-pointer rounded ${sizeClasses} text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600`}
      aria-label={ariaLabel}
    >
      <Trash2 className={iconSize} />
    </span>
  );
}
