export function register(): void {
  // Suppress DEP0169: url.parse() deprecation warning emitted by Next.js internals.
  // Cannot be fixed in our source — the call site is inside next/dist.
  // Monkey-patching process.emitWarning is the only way to suppress it without
  // using --no-deprecation (which would silence all deprecation warnings).
  const original = process.emitWarning.bind(process);
  process.emitWarning = (warning: string | Error, ...args: unknown[]): void => {
    const msg = typeof warning === "string" ? warning : warning.message;
    if (msg.includes("url.parse()")) return;
    // biome-ignore lint/suspicious/noExplicitAny: spread over overloaded signature
    (original as (...a: any[]) => void)(warning, ...args);
  };
}
