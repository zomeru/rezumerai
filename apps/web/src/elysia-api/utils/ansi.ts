// ─── ANSI Color Constants ─────────────────────────────────────────────────────

export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  white: "\x1b[37m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",

  // Background
  bgGreen: "\x1b[42m",
  bgCyan: "\x1b[46m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
  bgMagenta: "\x1b[45m",
  bgBlue: "\x1b[44m",
} as const;

// ─── Base Helpers ─────────────────────────────────────────────────────────────

export const paint = (color: keyof typeof c, text: string): string => `${c[color]}${text}${c.reset}`;
export const bold = (text: string): string => `${c.bold}${text}${c.reset}`;
export const dim = (text: string): string => `${c.dim}${text}${c.reset}`;
export const timestamp = (): string => dim(new Date().toISOString());

// ─── Method Coloring ─────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, keyof typeof c> = {
  GET: "bgGreen",
  POST: "bgBlue",
  PUT: "bgYellow",
  PATCH: "bgMagenta",
  DELETE: "bgRed",
  HEAD: "bgCyan",
  OPTIONS: "bgCyan",
};

export function colorizeMethod(method: string): string {
  const color = METHOD_COLORS[method] ?? "bgCyan";
  return paint(color, ` ${bold(method)} `);
}

// ─── Status Coloring ─────────────────────────────────────────────────────────

export function colorizeStatus(status: number): string {
  if (status < 300) return paint("green", String(status));
  if (status < 400) return paint("cyan", String(status));
  if (status < 500) return paint("yellow", String(status));
  return paint("red", String(status));
}

// ─── Duration Coloring ───────────────────────────────────────────────────────

export function colorizeDuration(ms: number): string {
  const label = `${ms.toFixed(2)}ms`;
  if (ms < 100) return paint("green", label);
  if (ms < 500) return paint("yellow", label);
  return paint("red", label);
}

// ─── Elapsed Coloring (finer scale for trace spans) ─────────────────────────

export function colorizeElapsed(ms: number): string {
  const label = `${ms.toFixed(2)}ms`;
  if (ms < 10) return paint("green", label);
  if (ms < 50) return paint("cyan", label);
  if (ms < 200) return paint("yellow", label);
  return paint("red", label);
}

// ─── Byte Formatting ─────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "-";
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}
