import { v4 as uuidv4 } from "uuid";

export function onKeyDown(e: React.KeyboardEvent): void {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
}

export function generateUuidKey(id?: string): string {
  return id ?? uuidv4();
}
