"use client";

import { AlertCircle, ArrowLeft, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routing";
import { useAdminErrorLogDetail, useMarkAdminErrorAsRead } from "@/hooks/useErrorLogs";

interface ErrorDetailPageClientProps {
  errorId: string;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function resolveStackTrace(stackTraceJson: string): string {
  try {
    const parsed = JSON.parse(stackTraceJson) as {
      rawStack?: string | null;
      stackLines?: string[];
    };

    if (typeof parsed.rawStack === "string" && parsed.rawStack.length > 0) {
      return parsed.rawStack;
    }

    if (Array.isArray(parsed.stackLines) && parsed.stackLines.length > 0) {
      return parsed.stackLines.join("\n");
    }

    return stackTraceJson;
  } catch {
    return stackTraceJson;
  }
}

export default function ErrorDetailPageClient({ errorId }: ErrorDetailPageClientProps): React.JSX.Element {
  const { data, error, isLoading } = useAdminErrorLogDetail(errorId);
  const markAsRead = useMarkAdminErrorAsRead();

  const stackTrace = useMemo(() => {
    if (!data) {
      return "";
    }

    return resolveStackTrace(data.stackTraceJson);
  }, [data]);

  async function onMarkAsRead(): Promise<void> {
    if (!data || data.isRead) {
      return;
    }

    try {
      await markAsRead.mutateAsync(data.id);
      toast.success("Error marked as read.");
    } catch (markError: unknown) {
      const message = markError instanceof Error ? markError.message : "Failed to mark error as read.";
      toast.error(message);
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.ADMIN_ERROR}
          className="mb-6 inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to error list
        </Link>

        {isLoading ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
            <div className="h-48 animate-pulse rounded bg-slate-200" />
          </div>
        ) : error || !data ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Unable to load error details</p>
                <p className="mt-1 text-red-700 text-sm">{error?.message ?? "The error log entry was not found."}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Error Detail</p>
                  <h1 className="mt-2 font-bold text-2xl text-slate-900 sm:text-3xl">{data.errorName}</h1>
                  <p className="mt-2 text-slate-700">{data.message}</p>
                  <p className="mt-2 text-slate-500 text-sm">Logged: {formatDateTime(data.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 font-semibold text-xs ${
                      data.isRead ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {data.isRead ? "Read" : "Unread"}
                  </span>

                  {!data.isRead && (
                    <button
                      type="button"
                      onClick={() => void onMarkAsRead()}
                      disabled={markAsRead.isPending}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {markAsRead.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCheck className="size-4" />
                      )}
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Method</p>
                <p className="mt-1 font-semibold text-slate-900">{data.method}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Endpoint</p>
                <p className="mt-1 break-all font-semibold text-slate-900">{data.endpoint}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Function</p>
                <p className="mt-1 font-semibold text-slate-900">{data.functionName ?? "Unknown"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Environment</p>
                <p className="mt-1 font-semibold text-slate-900">{data.environment}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">User ID</p>
                <p className="mt-1 break-all font-semibold text-slate-900">{data.userId ?? "N/A"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Read At</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDateTime(data.readAt)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide">Read By User ID</p>
                <p className="mt-1 break-all font-semibold text-slate-900">{data.readByUserId ?? "N/A"}</p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900 text-xl">Stack Trace</h2>
              <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-slate-100 text-xs leading-relaxed">
                {stackTrace}
              </pre>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-900">Query Params</h3>
                <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-slate-800 text-xs">
                  {formatJson(data.queryParams)}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-900">Request Body</h3>
                <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-slate-800 text-xs">
                  {formatJson(data.requestBody)}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-slate-900">Headers (redacted)</h3>
                <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-slate-800 text-xs">
                  {formatJson(data.headers)}
                </pre>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-900">Full Error Payload</h3>
              <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-slate-800 text-xs">
                {formatJson(data)}
              </pre>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
