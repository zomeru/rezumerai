const AUTH_OPTIONAL_PATHS = new Set(["/api/ai/assistant/chat", "/api/ai/assistant/history"]);

export function isAuthOptionalPath(pathname: string): boolean {
  return AUTH_OPTIONAL_PATHS.has(pathname);
}
