"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routing";
import { useAuditLogDetail } from "@/hooks/useAdmin";
import { AdminBadge, AdminPageShell, AdminPanel, JsonCodeBlock } from "./AdminUI";
import { formatDateTime, formatJson } from "./format";

function resolveTone(category: "USER_ACTION" | "SYSTEM_ACTIVITY" | "DATABASE_CHANGE"): "info" | "warning" | "neutral" {
  if (category === "DATABASE_CHANGE") {
    return "warning";
  }

  if (category === "SYSTEM_ACTIVITY") {
    return "neutral";
  }

  return "info";
}

export default function AuditLogDetailPageClient({ auditId }: { auditId: string }): React.JSX.Element {
  const { data, error, isLoading } = useAuditLogDetail(auditId);

  return (
    <AdminPageShell
      title="Audit Log Detail"
      description="Inspect captured metadata, request context, and before/after snapshots for a single audit event."
      action={
        <Link
          href={ROUTES.ADMIN_AUDIT_LOGS}
          className="inline-flex items-center gap-2 text-slate-600 text-sm transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to audit logs
        </Link>
      }
    >
      {isLoading ? (
        <AdminPanel>
          <div className="h-96 animate-pulse rounded bg-slate-200" />
        </AdminPanel>
      ) : error || !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Unable to load audit detail</p>
              <p className="mt-1 text-red-700 text-sm">{error?.message ?? "The audit log entry could not be found."}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminPanel>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Audit Event</p>
                <h2 className="mt-2 font-bold text-2xl text-slate-900">{data.eventType}</h2>
                <p className="mt-2 text-slate-600">
                  {data.action} on {data.resourceType}
                </p>
                <p className="mt-2 text-slate-500 text-sm">Captured {formatDateTime(data.createdAt)}</p>
              </div>
              <AdminBadge tone={resolveTone(data.category)}>{data.category.replaceAll("_", " ")}</AdminBadge>
            </div>
          </AdminPanel>

          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Actor</p>
              <p className="mt-1 font-semibold text-slate-900">{data.actor ? data.actor.email : "System"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Resource ID</p>
              <p className="mt-1 break-all font-semibold text-slate-900">{data.resourceId ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Service</p>
              <p className="mt-1 font-semibold text-slate-900">{data.serviceName ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Method</p>
              <p className="mt-1 font-semibold text-slate-900">{data.method ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Endpoint</p>
              <p className="mt-1 break-all font-semibold text-slate-900">{data.endpoint ?? "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500 text-xs uppercase tracking-wide">User ID</p>
              <p className="mt-1 break-all font-semibold text-slate-900">{data.userId ?? "N/A"}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <JsonCodeBlock title="Request Metadata" value={formatJson(data.requestMetadata)} />
            <JsonCodeBlock title="Before Values" value={formatJson(data.beforeValues)} />
            <JsonCodeBlock title="After Values" value={formatJson(data.afterValues)} />
          </div>

          <JsonCodeBlock title="Full Audit Payload" value={formatJson(data)} />
        </div>
      )}
    </AdminPageShell>
  );
}
