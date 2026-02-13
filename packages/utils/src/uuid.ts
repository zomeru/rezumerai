import { v4 as uuidv4 } from "uuid";

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
