"use client";

import { AlertCircle, ArrowLeft, Eye, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routing";
import { useAuditLogs } from "@/hooks/useAdmin";
import {
  AdminEmptyState,
  AdminFieldLabel,
  AdminFilterGrid,
  AdminInput,
  AdminPageShell,
  AdminPagination,
  AdminSelect,
  AdminTableWrapper,
  AdminTabs,
} from "./AdminUI";
import { formatDateTime } from "./format";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const SKELETON_KEYS = [
  "audit-skeleton-1",
  "audit-skeleton-2",
  "audit-skeleton-3",
  "audit-skeleton-4",
  "audit-skeleton-5",
  "audit-skeleton-6",
] as const;
const CATEGORY_OPTIONS = [
  { value: "USER_ACTION", label: "User Actions" },
  { value: "SYSTEM_ACTIVITY", label: "System Activities" },
  { value: "DATABASE_CHANGE", label: "Database Changes" },
] as const;

export default function AuditLogsPageClient(): React.JSX.Element {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("USER_ACTION");

  const query = useMemo(
    () => ({
      page,
      pageSize,
      search,
      category,
    }),
    [category, page, pageSize, search],
  );

  const { data, error, isLoading, isFetching, refetch } = useAuditLogs(query);
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <AdminPageShell
      title="Audit Logs"
      description="Trace user actions, system activity, and database changes with a searchable, category-driven audit trail."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.ADMIN}
            className="inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            Back to admin
          </Link>

          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm shadow-sm transition-all hover:bg-slate-50"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      }
    >
      <AdminTabs
        value={category}
        onChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
        options={CATEGORY_OPTIONS.map((option) => ({
          ...option,
          count: data?.countsByCategory[option.value] ?? 0,
        }))}
      />

      <AdminFilterGrid className="sm:grid-cols-3">
        <AdminFieldLabel label="Search audit trail">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
            <AdminInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Action, user, endpoint, resource"
              className="w-full pl-9"
            />
          </div>
        </AdminFieldLabel>

        <AdminFieldLabel label="Page size">
          <AdminSelect
            value={pageSize}
            onChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </AdminSelect>
        </AdminFieldLabel>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <p className="text-slate-500">Matching entries</p>
          <p className="font-semibold text-slate-800 text-xl">{data?.pagination.totalCount ?? 0}</p>
        </div>
      </AdminFilterGrid>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load audit logs</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : data && data.items.length === 0 && !isLoading ? (
        <AdminEmptyState
          title="No audit entries found"
          description="The selected category and filters did not match any audit log entries."
        />
      ) : (
        <>
          <AdminTableWrapper>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Event Type</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Resource</th>
                  <th className="px-4 py-3 text-left">User / System</th>
                  <th className="px-4 py-3 text-left">Endpoint</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? SKELETON_KEYS.map((key) => (
                      <tr key={key}>
                        <td className="px-4 py-4">
                          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-18 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="ml-auto h-8 w-16 animate-pulse rounded bg-slate-200" />
                        </td>
                      </tr>
                    ))
                  : data?.items.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                        onClick={() => router.push(`${ROUTES.ADMIN_AUDIT_LOGS}/${item.id}`)}
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900">{item.eventType}</td>
                        <td className="px-4 py-4 text-slate-600">{item.action}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">{item.resourceType}</p>
                          <p className="text-slate-500 text-xs">{item.resourceId ?? "No resource ID"}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{item.actor ? item.actor.email : "System"}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {item.endpoint ? `${item.method ?? ""} ${item.endpoint}` : "N/A"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`${ROUTES.ADMIN_AUDIT_LOGS}/${item.id}`);
                            }}
                          >
                            <Eye className="size-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </AdminTableWrapper>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            canGoPrevious={page > 1}
            canGoNext={totalPages > 0 && page < totalPages}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </>
      )}
    </AdminPageShell>
  );
}
