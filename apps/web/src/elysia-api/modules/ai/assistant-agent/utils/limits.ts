export function clampRequestedLimit(limit: number | null | undefined, fallback: number): number {
  if (!limit || Number.isNaN(limit)) {
    return fallback;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit)));
}
