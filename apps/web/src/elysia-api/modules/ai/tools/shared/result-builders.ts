import type { ToolEntityRecord } from "../types";

export function createToolCollectionResult<T extends ToolEntityRecord>(
  entity: string,
  items: T[],
  summary: string,
  meta?: Record<string, unknown>,
) {
  return {
    type: "collection" as const,
    entity,
    summary,
    count: items.length,
    items,
    meta: meta ?? null,
  };
}

export function createToolDetailResult<T extends ToolEntityRecord>(entity: string, item: T, summary: string) {
  return {
    type: "detail" as const,
    entity,
    summary,
    item,
  };
}

export function createToolMetricResult<T extends ToolEntityRecord>(entity: string, data: T, summary: string) {
  return {
    type: "metric" as const,
    entity,
    summary,
    data,
  };
}
