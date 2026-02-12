import { v4 as uuidv4 } from "uuid";

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
export function onKeyDown(e: React.KeyboardEvent): void {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
}

/**
 * Generates or returns a UUID string for use as a unique key.
 * Uses provided ID if available, otherwise generates a new UUIDv4.
 *
 * @param id - Optional existing ID to return
 * @returns The provided ID or a newly generated UUID
 *
 * @example
 * ```ts
 * generateUuidKey() // => "550e8400-e29b-41d4-a716-446655440000"
 * generateUuidKey("existing-id") // => "existing-id"
 * ```
 */
export function generateUuidKey(id?: string): string {
  return id ?? uuidv4();
}
