"use client";

import { cn } from "@rezumerai/utils/styles";
import { Check, Copy, Maximize2, Minimize2, TriangleAlert } from "lucide-react";
import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JsonView } from "react-json-view-lite";

type JsonPrimitive = boolean | number | string | null;
type JsonSafeValue = JsonPrimitive | JsonObject | JsonSafeValue[];

interface JsonObject {
  [key: string]: JsonSafeValue;
}

type JsonTreeData = JsonObject | JsonSafeValue[];
type ExpandMode = "auto" | "collapsed" | "expanded";

interface JsonViewerProps {
  value: unknown;
  parseStringAsJson?: boolean;
  className?: string;
  maxHeightClassName?: string;
}

type ResolvedJsonViewerValue =
  | {
      kind: "invalid";
      formattedText: string;
      rawText: string;
      error?: string;
      autoExpandDepth: number | null;
      isLarge: boolean;
    }
  | {
      kind: "primitive";
      formattedText: string;
      primitive: JsonPrimitive;
      autoExpandDepth: number | null;
      isLarge: boolean;
    }
  | {
      kind: "tree";
      formattedText: string;
      data: JsonTreeData;
      autoExpandDepth: number | null;
      isLarge: boolean;
    };

const AUTO_COLLAPSE_AT = 6_000;
const HEAVY_COLLAPSE_AT = 24_000;

const jsonViewerStyles = {
  container: "min-w-max font-mono text-[13px] leading-5 text-slate-800",
  basicChildStyle: "pl-4 py-0.5",
  childFieldsContainer: "m-0 list-none pl-4",
  label: "mr-2 text-slate-700",
  clickableLabel: "mr-2 cursor-pointer text-slate-700 transition-colors hover:text-slate-900",
  nullValue: "text-fuchsia-700",
  undefinedValue: "text-fuchsia-700",
  stringValue: "text-emerald-700",
  booleanValue: "text-amber-700",
  numberValue: "text-sky-700",
  otherValue: "text-rose-700",
  punctuation: "text-slate-400",
  collapseIcon: "mr-1 inline-block cursor-pointer align-middle text-slate-400 after:content-['▾'] after:text-[11px]",
  expandIcon: "mr-1 inline-block cursor-pointer align-middle text-slate-400 after:content-['▸'] after:text-[11px]",
  collapsedContent: "ml-1 cursor-pointer text-slate-400 after:content-['…']",
  quotesForFieldNames: false,
  stringifyStringValues: true,
  ariaLables: {
    collapseJson: "Collapse JSON node",
    expandJson: "Expand JSON node",
  },
} satisfies NonNullable<ComponentProps<typeof JsonView>["style"]>;

function isJsonTreeData(value: JsonSafeValue): value is JsonTreeData {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function toSafeJsonValue(value: unknown, seen = new WeakSet<object>()): JsonSafeValue {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "undefined") {
    return "[undefined]";
  }

  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
    };
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);
    return value.map((entry) => toSafeJsonValue(entry, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    const record: Record<string, JsonSafeValue> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      record[key] = toSafeJsonValue(nestedValue, seen);
    }

    return record;
  }

  return String(value);
}

function safePrettyPrint(value: JsonSafeValue): string {
  return JSON.stringify(value, null, 2) ?? "null";
}

function resolveAutoExpandDepth(formattedText: string): number | null {
  if (formattedText.length >= HEAVY_COLLAPSE_AT) {
    return 1;
  }

  if (formattedText.length >= AUTO_COLLAPSE_AT) {
    return 2;
  }

  return null;
}

function resolveJsonViewerValue(value: unknown, parseStringAsJson: boolean): ResolvedJsonViewerValue {
  if (parseStringAsJson && typeof value === "string") {
    try {
      return resolveJsonViewerValue(JSON.parse(value), false);
    } catch (error: unknown) {
      return {
        kind: "invalid",
        formattedText: value,
        rawText: value,
        error: error instanceof Error ? error.message : "Invalid JSON input.",
        autoExpandDepth: null,
        isLarge: value.length >= AUTO_COLLAPSE_AT,
      };
    }
  }

  const safeValue = toSafeJsonValue(value);
  const formattedText = safePrettyPrint(safeValue);
  const autoExpandDepth = resolveAutoExpandDepth(formattedText);

  if (isJsonTreeData(safeValue)) {
    return {
      kind: "tree",
      data: safeValue,
      formattedText,
      autoExpandDepth,
      isLarge: autoExpandDepth !== null,
    };
  }

  return {
    kind: "primitive",
    primitive: safeValue,
    formattedText,
    autoExpandDepth,
    isLarge: false,
  };
}

async function copyTextToClipboard(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is unavailable.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function resolvePrimitiveClassName(value: JsonPrimitive): string {
  if (value === null) {
    return "text-fuchsia-700";
  }

  if (typeof value === "number") {
    return "text-sky-700";
  }

  if (typeof value === "boolean") {
    return "text-amber-700";
  }

  return "text-emerald-700";
}

export default function JsonViewer({
  value,
  parseStringAsJson = false,
  className,
  maxHeightClassName = "max-h-96",
}: JsonViewerProps): React.JSX.Element {
  const resolvedValue = useMemo(() => resolveJsonViewerValue(value, parseStringAsJson), [parseStringAsJson, value]);
  const [expandMode, setExpandMode] = useState<ExpandMode>("auto");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setExpandMode("auto");
    setCopyState("idle");
  }, [resolvedValue.formattedText]);

  useEffect(() => {
    if (copyState !== "copied") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  const shouldExpandNode = useCallback(
    (level: number): boolean => {
      if (expandMode === "expanded") {
        return true;
      }

      if (expandMode === "collapsed") {
        return level < 1;
      }

      if (resolvedValue.autoExpandDepth === null) {
        return true;
      }

      return level < resolvedValue.autoExpandDepth;
    },
    [expandMode, resolvedValue.autoExpandDepth],
  );

  async function onCopy(): Promise<void> {
    await copyTextToClipboard(resolvedValue.formattedText);

    if (isMountedRef.current) {
      setCopyState("copied");
    }
  }

  let content: React.ReactNode;

  if (resolvedValue.kind === "invalid") {
    content = (
      <div className="space-y-3 p-3">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Invalid JSON</p>
            <p className="mt-1 text-amber-700">Fix the editor value to restore the structured preview.</p>
            {resolvedValue.error ? <p className="mt-1 text-amber-700/80">{resolvedValue.error}</p> : null}
          </div>
        </div>

        <pre
          className={cn(
            "overflow-auto rounded-lg border border-slate-200 bg-white px-3 py-3 font-mono text-slate-800 text-xs leading-relaxed",
            maxHeightClassName,
          )}
        >
          {resolvedValue.rawText}
        </pre>
      </div>
    );
  } else if (resolvedValue.kind === "primitive") {
    content = (
      <div className={cn("overflow-auto px-3 py-3", maxHeightClassName)}>
        <pre
          className={cn("font-mono text-[13px] leading-5", resolvePrimitiveClassName(resolvedValue.primitive ?? null))}
        >
          {resolvedValue.formattedText}
        </pre>
      </div>
    );
  } else {
    content = (
      <div className={cn("overflow-auto px-3 py-3", maxHeightClassName)}>
        <JsonView
          data={resolvedValue.data}
          style={jsonViewerStyles}
          shouldExpandNode={shouldExpandNode}
          clickToExpandNode={true}
          aria-label="Structured JSON viewer"
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-slate-50", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-slate-200 border-b bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs">
          {resolvedValue.isLarge ? (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              Nested levels auto-collapsed
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {resolvedValue.kind === "tree" ? (
            <>
              <button
                type="button"
                onClick={() => setExpandMode("collapsed")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
              >
                <Minimize2 className="size-3.5" />
                Collapse all
              </button>

              <button
                type="button"
                onClick={() => setExpandMode("expanded")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
              >
                <Maximize2 className="size-3.5" />
                Expand all
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => void onCopy()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
          >
            {copyState === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copyState === "copied" ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>
      {content}
    </div>
  );
}
