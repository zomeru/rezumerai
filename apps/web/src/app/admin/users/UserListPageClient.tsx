"use client";

import { AlertCircle, ArrowLeft, Eye, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routing";
import { useAdminUsers } from "@/hooks/useAdmin";
import {
  AdminBadge,
  AdminEmptyState,
  AdminFieldLabel,
  AdminFilterGrid,
  AdminInput,
  AdminPageShell,
  AdminPagination,
  AdminSelect,
  AdminTableWrapper,
} from "../_components/AdminUI";
import { formatDateTime } from "../_components/format";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "ADMIN", label: "Admins" },
  { value: "USER", label: "Users" },
] as const;
const SKELETON_KEYS = [
  "user-skeleton-1",
  "user-skeleton-2",
  "user-skeleton-3",
  "user-skeleton-4",
  "user-skeleton-5",
] as const;

export default function UserListPageClient(): React.JSX.Element {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("all");

  const query = useMemo(
    () => ({
      page,
      pageSize,
      search,
      role,
    }),
    [page, pageSize, role, search],
  );

  const { data, error, isLoading, isFetching, refetch } = useAdminUsers(query);
  const totalPages = data?.pagination.totalPages ?? 0;
  const totalCount = data?.pagination.totalCount ?? 0;

  return (
    <AdminPageShell
      title="Users"
      description="Review platform users, inspect account usage, and navigate to detailed admin controls."
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
      <AdminFilterGrid className="sm:grid-cols-4">
        <AdminFieldLabel label="Search users">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
            <AdminInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Name or email"
              className="w-full pl-9"
            />
          </div>
        </AdminFieldLabel>

        <AdminFieldLabel label="Role">
          <AdminSelect
            value={role}
            onChange={(value) => {
              setRole(value as (typeof ROLE_OPTIONS)[number]["value"]);
              setPage(1);
            }}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
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
          <p className="text-slate-500">Total users</p>
          <p className="font-semibold text-slate-800 text-xl">{totalCount}</p>
        </div>
      </AdminFilterGrid>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load users</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : data && data.items.length === 0 && !isLoading ? (
        <AdminEmptyState
          title="No users matched your filters"
          description="Try widening the search or selecting a different role filter."
        />
      ) : (
        <>
          <AdminTableWrapper>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Resumes</th>
                  <th className="px-4 py-3 text-left">AI Credits</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
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
                          <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-18 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="ml-auto h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
                        </td>
                      </tr>
                    ))
                  : data?.items.map((item) => (
                      <tr
                        key={item.id}
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                        onClick={() => router.push(`${ROUTES.ADMIN_USERS}/${item.id}`)}
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-4 py-4 text-slate-600">{item.email}</td>
                        <td className="px-4 py-4">
                          <AdminBadge tone={item.role === "ADMIN" ? "info" : "neutral"}>{item.role}</AdminBadge>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{item.resumeCount}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {item.credits.remaining} / {item.credits.dailyLimit}
                        </td>
                        <td className="px-4 py-4">
                          <AdminBadge tone="success">{item.status}</AdminBadge>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`${ROUTES.ADMIN_USERS}/${item.id}`);
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
