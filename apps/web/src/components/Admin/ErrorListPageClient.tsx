"use client";

import { AlertCircle, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routing";
import { useAdminErrorLogs } from "@/hooks/useErrorLogs";
import { AdminPageShell, AdminSelect } from "./AdminUI";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const READ_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
] as const;
const SKELETON_ROW_KEYS = [
  "skeleton-row-1",
  "skeleton-row-2",
  "skeleton-row-3",
  "skeleton-row-4",
  "skeleton-row-5",
  "skeleton-row-6",
  "skeleton-row-7",
  "skeleton-row-8",
] as const;

type ReadFilter = (typeof READ_FILTER_OPTIONS)[number]["value"];

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function toApiIsRead(value: ReadFilter): boolean | undefined {
  if (value === "read") {
    return true;
  }

  if (value === "unread") {
    return false;
  }

  return undefined;
}

export default function ErrorListPageClient(): React.JSX.Element {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const isReadFilter = useMemo(() => toApiIsRead(readFilter), [readFilter]);

  const { data, error, isLoading, isFetching, refetch } = useAdminErrorLogs({
    page,
    pageSize,
    isRead: isReadFilter,
  });

  const totalPages = data?.pagination.totalPages ?? 0;
  const totalCount = data?.pagination.totalCount ?? 0;
  const canGoPrevious = page > 1;
  const canGoNext = totalPages > 0 && page < totalPages;

  function onChangePageSize(nextPageSize: number): void {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function onChangeFilter(nextFilter: ReadFilter): void {
    setReadFilter(nextFilter);
    setPage(1);
  }

  return (
    <AdminPageShell
      title="Error Tracking"
      description="Inspect backend failures, triage incidents, and mark logs as reviewed."
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <AdminSelect
          label="Filter"
          value={readFilter}
          onChange={(value) => onChangeFilter(value === "read" || value === "unread" ? value : "all")}
          options={READ_FILTER_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />

        <AdminSelect
          label="Page size"
          value={pageSize}
          onChange={(value) => onChangePageSize(Number(value))}
          options={PAGE_SIZE_OPTIONS.map((value) => ({
            value: String(value),
            label: String(value),
          }))}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="text-slate-500">Total Logs</p>
          <p className="font-semibold text-slate-800 text-xl">{totalCount}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load error logs</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Error</th>
                  <th className="px-4 py-3 text-left">Date/Time</th>
                  <th className="px-4 py-3 text-left">Endpoint</th>
                  <th className="px-4 py-3 text-left">Function</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  SKELETON_ROW_KEYS.map((skeletonKey) => (
                    <tr key={skeletonKey}>
                      <td className="px-4 py-4">
                        <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="ml-auto h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
                      </td>
                    </tr>
                  ))
                ) : data?.items.length ? (
                  data.items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-900">{item.errorName}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-800">{item.method.toUpperCase()}</span>
                        <span className="ml-2 text-slate-600">{item.endpoint}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.functionName ?? "Unknown"}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 font-semibold text-xs ${
                            item.isRead ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.isRead ? "Read" : "Unread"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`${ROUTES.ADMIN_ERROR}/${item.id}`);
                          }}
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-12 text-center text-slate-500" colSpan={6}>
                      No error logs found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
        <p className="text-slate-600 text-sm">
          Page {page}
          {totalPages > 0 ? ` of ${totalPages}` : ""}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!canGoPrevious}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!canGoNext}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </AdminPageShell>
  );
}
