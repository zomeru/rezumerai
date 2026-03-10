import { compactText } from "../../utils";
import { MAX_COLLECTION_PREVIEW_ITEMS, replyDateFormatter } from "../constants";

export function humanizeKey(key: string): string {
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\bid\b/g, "ID")
    .replace(/\bai\b/g, "AI")
    .replace(/\bapi\b/g, "API")
    .trim();

  return normalized.length > 0 ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : key;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function joinReplySections(sections: Array<string | null | undefined | false>): string {
  return sections
    .map((section) => (typeof section === "string" ? section.trim() : ""))
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export function toBulletList(items: Array<string | null | undefined | false>): string {
  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}

export function toOrderedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function formatReplyDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : replyDateFormatter.format(parsed);
}

export function formatPreviewOverflow(total: number, shown: number): string | null {
  return total > shown ? `Showing first ${shown} of ${total}.` : null;
}

export function formatResumeLine(item: Record<string, unknown>, fallbackLabel: string): string {
  const title = typeof item.title === "string" && item.title.trim().length > 0 ? item.title : fallbackLabel;
  const updatedAt = formatReplyDate(item.updatedAt);
  const details = [
    updatedAt ? `Updated ${updatedAt}.` : null,
    typeof item.visibility === "string" && item.visibility.length > 0 ? `Visibility: ${item.visibility}.` : null,
  ].filter(Boolean);

  return `**${title}**${details.length > 0 ? ` ${details.join(" ")}` : ""}`;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "string") {
    const formattedDate = formatReplyDate(value);

    if (formattedDate) {
      return formattedDate;
    }

    return compactText(value, 220);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return compactText(value.map((item) => formatValue(item)).join(", "), 220);
  }

  if (typeof value === "object") {
    return compactText(JSON.stringify(value), 220);
  }

  return compactText(String(value), 220);
}

export function prioritizeEntries(record: Record<string, unknown>) {
  const priorityOrder = [
    "title",
    "name",
    "email",
    "role",
    "errorName",
    "action",
    "eventType",
    "resourceType",
    "selectedModelId",
    "requestCount",
    "errorCount",
    "activeUsers",
    "createdAt",
    "updatedAt",
  ];

  return Object.entries(record).sort((left, right) => {
    const leftIndex = priorityOrder.indexOf(left[0]);
    const rightIndex = priorityOrder.indexOf(right[0]);

    if (leftIndex === -1 && rightIndex === -1) {
      return left[0].localeCompare(right[0]);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

export function formatCompactRecord(record: Record<string, unknown>, omitIds = true): string {
  const parts = prioritizeEntries(record)
    .filter(([key, value]) => value !== null && value !== undefined && (!omitIds || !/(^id$|Id$)/.test(key)))
    .slice(0, 4)
    .map(([key, value]) => `${humanizeKey(key)}: ${formatValue(value)}`);

  return parts.length > 0 ? parts.join(", ") : "No details";
}

export { MAX_COLLECTION_PREVIEW_ITEMS };
