import type { Prisma } from "@rezumerai/database";

export const REDACTED_VALUE = "[REDACTED]";
const MAX_STRING_LENGTH = 10_000;
const MAX_ARRAY_LENGTH = 50;
const MAX_OBJECT_ENTRIES = 50;
const MAX_DEPTH = 8;
type SerializableJson = string | number | boolean | null | SerializableJson[] | { [key: string]: SerializableJson };

const SENSITIVE_KEYWORDS = [
  "password",
  "pass",
  "pwd",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "api_key",
  "apikey",
  "client_secret",
  "private_key",
  "refresh_token",
  "access_token",
  "id_token",
] as const;

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}... [truncated]`;
}

export function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return SENSITIVE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function toSerializableValue(value: unknown, depth = 0): SerializableJson {
  if (depth > MAX_DEPTH) {
    return "[Max depth reached]";
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
      stack: value.stack ? truncateString(value.stack) : null,
    };
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_LENGTH).map((item) => toSerializableValue(item, depth + 1));

    if (value.length > MAX_ARRAY_LENGTH) {
      items.push(`[${value.length - MAX_ARRAY_LENGTH} additional items truncated]`);
    }

    return items;
  }

  if (typeof value === "object") {
    const result: Record<string, SerializableJson> = {};
    const entries = Object.entries(value);

    for (const [key, nestedValue] of entries.slice(0, MAX_OBJECT_ENTRIES)) {
      result[key] = shouldRedactKey(key) ? REDACTED_VALUE : toSerializableValue(nestedValue, depth + 1);
    }

    if (entries.length > MAX_OBJECT_ENTRIES) {
      result.__truncatedKeys = `[${entries.length - MAX_OBJECT_ENTRIES} additional keys truncated]`;
    }

    return result;
  }

  return String(value);
}

export function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null {
  if (value === undefined) {
    return null;
  }

  const serialized = toSerializableValue(value);

  if (serialized === undefined) {
    return null;
  }

  return serialized;
}

export function toPrettyJson(value: unknown): string {
  if (value === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(toSerializableValue(value), null, 2);
  } catch {
    return String(value);
  }
}
