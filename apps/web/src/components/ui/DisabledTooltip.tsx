"use client";

import { cn } from "@rezumerai/utils/styles";

export function DisabledTooltip({
  message,
  children,
  className,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("group/tooltip relative inline-flex", className)}>
      <div className="w-full cursor-not-allowed" tabIndex={0} title={message}>
        {children}
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-center text-white text-xs shadow-lg group-focus-within/tooltip:block group-hover/tooltip:block"
      >
        {message}
      </div>
    </div>
  );
}
