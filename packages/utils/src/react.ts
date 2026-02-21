import type React from "react";

/**
 * Stops keyboard event propagation for Enter and Space keys.
 * Prevents unintended parent element interactions when these keys are pressed.
 *
 * @param e - React keyboard event
 *
 * @example
 * ```tsx
 * <div onKeyDown={onKeyDown}>
 *   <input /> // Enter/Space won't bubble up
 * </div>
 * ```
 */
export function onKeyDown(e: React.KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
}
