import { v4 as uuidv4 } from "uuid";

export function onKeyDown(e: React.KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();
}

export function generateUuidKey(id?: string) {
  return id ?? uuidv4();
}
