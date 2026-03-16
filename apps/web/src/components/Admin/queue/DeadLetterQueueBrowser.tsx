"use client";

/**
 * Dead Letter Queue Browser Component
 * View and manage failed jobs
 * Refactored to use shared admin UI components
 */

import { AlertTriangle, CheckCircle, Eye, Play, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AdminBadge,
  AdminEmptyState,
  AdminFieldLabel,
  AdminInput,
  AdminPanel,
  AdminTableWrapper,
} from "@/components/Admin/AdminUI";

interface DeadLetterJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  failedAt: string;
  retryCount: number;
  errorMessage: string | null;
  errorStack: string | null;
}

interface DeadLetterStats {
  total: number;
  byQueue: Record<string, number>;
  oldestFailedAt: string | null;
  newestFailedAt: string | null;
}

export function DeadLetterQueueBrowser() {
  const [jobs, setJobs] = useState<DeadLetterJob[]>([]);
  const [stats, setStats] = useState<DeadLetterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<DeadLetterJob | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [cleanupDays, setCleanupDays] = useState(30);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/queue/dead-letter");
      if (!response.ok) throw new Error("Failed to fetch dead letter jobs");
      const result = await response.json();
      setJobs(result.jobs);
      setStats(result.stats);
    } catch (error) {
      toast.error("Failed to load dead letter jobs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      const response = await fetch(`/api/admin/queue/dead-letter/${jobId}/retry`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to retry job");
      toast.success("Job queued for retry");
      fetchJobs();
    } catch (error) {
      toast.error("Failed to retry job");
      console.error(error);
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/queue/dead-letter/${jobId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete job");
      toast.success("Job deleted");
      fetchJobs();
    } catch (error) {
      toast.error("Failed to delete job");
      console.error(error);
    }
  };

  const handleRetryAll = async () => {
    try {
      const response = await fetch("/api/admin/queue/dead-letter/retry-all", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to retry all jobs");
      const result = await response.json();
      toast.success(`Retried ${result.retried} jobs, ${result.failed} failed`);
      fetchJobs();
    } catch (error) {
      toast.error("Failed to retry all jobs");
      console.error(error);
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await fetch(`/api/admin/queue/dead-letter/cleanup?olderThanDays=${cleanupDays}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to cleanup jobs");
      const result = await response.json();
      toast.success(`Deleted ${result.deleted} old jobs`);
      fetchJobs();
    } catch (error) {
      toast.error("Failed to cleanup jobs");
      console.error(error);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Total Failed Jobs</p>
                <p className="mt-2 font-semibold text-3xl text-red-600">{stats.total}</p>
              </div>
              <span className="inline-flex rounded-xl border border-red-200 bg-red-50 p-2 text-red-700">
                <AlertTriangle className="size-5" />
              </span>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Oldest Failure</p>
                <p className="mt-2 font-semibold text-slate-900 text-xl">
                  {stats.oldestFailedAt ? formatDate(stats.oldestFailedAt) : "N/A"}
                </p>
              </div>
              <span className="inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
                <RefreshCw className="size-5" />
              </span>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Newest Failure</p>
                <p className="mt-2 font-semibold text-slate-900 text-xl">
                  {stats.newestFailedAt ? formatDate(stats.newestFailedAt) : "N/A"}
                </p>
              </div>
              <span className="inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
                <CheckCircle className="size-5" />
              </span>
            </div>
          </AdminPanel>
        </div>
      )}

      {/* Actions */}
      <AdminPanel>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchJobs}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm shadow-sm transition-all hover:bg-slate-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleRetryAll}
            disabled={jobs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="mr-2 h-4 w-4" />
            Retry All
          </button>

          <div className="ml-auto flex items-center gap-2">
            <AdminFieldLabel label="Cleanup older than (days)">
              <AdminInput
                value={String(cleanupDays)}
                onChange={(value) => setCleanupDays(Number(value))}
                type="number"
                min={1}
                className="w-24"
              />
            </AdminFieldLabel>
            <button
              type="button"
              onClick={handleCleanup}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 font-medium text-red-700 text-sm shadow-sm transition-all hover:bg-red-100"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cleanup
            </button>
          </div>
        </div>
      </AdminPanel>

      {/* Jobs Table */}
      <AdminPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-xl">Dead Letter Jobs</h3>
            <p className="mt-1 text-slate-500 text-sm">
              Jobs that failed after all retry attempts. You can retry or delete individual jobs.
            </p>
          </div>
        </div>

        <div className="mt-5">
          {jobs.length === 0 ? (
            <AdminEmptyState
              title="No failed jobs in the dead letter queue"
              description="All jobs have been processed successfully or cleaned up."
            />
          ) : (
            <AdminTableWrapper>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Job Name</th>
                    <th className="px-4 py-3 text-left">Failed At</th>
                    <th className="px-4 py-3 text-left">Retries</th>
                    <th className="px-4 py-3 text-left">Error</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-900">{job.name}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(job.failedAt)}</td>
                      <td className="px-4 py-4">
                        <AdminBadge tone="neutral">{job.retryCount}</AdminBadge>
                      </td>
                      <td className="max-w-xs truncate px-4 py-4 text-red-600">
                        {job.errorMessage || "Unknown error"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100"
                            onClick={() => setSelectedJob(job)}
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => handleRetry(job.id)}
                            disabled={retrying === job.id}
                          >
                            {retrying === job.id ? (
                              <RefreshCw className="size-3.5 animate-spin" />
                            ) : (
                              <Play className="size-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 font-medium text-red-700 text-xs transition-colors hover:bg-red-100"
                            onClick={() => handleDelete(job.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableWrapper>
          )}
        </div>
      </AdminPanel>

      {/* Job Detail Modal */}
      {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} onRetry={handleRetry} />}
    </div>
  );
}

function JobDetailModal({
  job,
  onClose,
  onRetry,
}: {
  job: DeadLetterJob;
  onClose: () => void;
  onRetry: (jobId: string) => Promise<void>;
}) {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
      />

      {/* Modal Content */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-xl">Job Details</h3>
            <p className="mt-1 text-slate-500 text-sm">{job.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Job Info Grid */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Job ID</p>
            <p className="mt-1 font-mono font-semibold text-slate-900 text-sm">{job.id}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Failed At</p>
            <p className="mt-1 font-semibold text-slate-900 text-sm">{formatDate(job.failedAt)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Retry Count</p>
            <p className="mt-1 font-semibold text-slate-900 text-sm">{job.retryCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-slate-500 text-xs uppercase tracking-wide">Error</p>
            <p className="mt-1 font-semibold text-red-600 text-sm">{job.errorMessage || "N/A"}</p>
          </div>
        </div>

        {/* Job Data */}
        <div className="mt-5">
          <p className="font-medium text-slate-700 text-sm">Job Data</p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            {JSON.stringify(job.data, null, 2)}
          </pre>
        </div>

        {/* Stack Trace */}
        {job.errorStack && (
          <div className="mt-5">
            <p className="font-medium text-slate-700 text-sm">Stack Trace</p>
            <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-red-50 p-4 font-mono text-red-600 text-xs">
              {job.errorStack}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={async () => {
              await onRetry(job.id);
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800"
          >
            <Play className="size-4" />
            Retry This Job
          </button>
        </div>
      </div>
    </div>
  );
}
