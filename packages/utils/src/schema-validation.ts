import type z from "zod";

// -----------------------
export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  return result.success ? { success: true, data: result.data } : { success: false, issues: result.error.issues };
}

export function mapFlatErrors(issues: z.ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string") errors[field] = issue.message;
  }
  return errors;
}

export function mapIndexedErrors(issues: z.ZodIssue[]) {
  const errors: Record<number, Record<string, string>> = {};
  for (const issue of issues) {
    const [idx, field] = issue.path;
    if (typeof idx === "number" && typeof field === "string") {
      if (!errors[idx]) errors[idx] = {};
      errors[idx][field] = issue.message;
    }
  }
  return errors;
}

export function mapInvalidIndices(issues: z.ZodIssue[]) {
  const invalids = new Set<number>();
  for (const issue of issues) {
    const idx = issue.path[0];
    if (typeof idx === "number") invalids.add(idx);
  }
  return invalids;
}

export function getFirstErrorMessage(
  errors: Record<string, string> | Record<number, Record<string, string>>,
): string | null {
  const first = Object.values(errors)[0];

  if (!first) return null;

  if (typeof first === "string") return first;

  // here we know first is Record<string, string>
  const nestedFirst = Object.values(first as Record<string, string>)[0];
  return nestedFirst ?? null;
}
