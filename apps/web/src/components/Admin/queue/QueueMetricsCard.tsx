"use client";

/**
 * Queue Metrics Card Component
 * Displays metrics for a single job queue
 * Refactored to use shared admin UI components
 */

import { AdminBadge, AdminPanel } from "@/components/Admin/AdminUI";

interface QueueMetricsCardProps {
  queueName: string;
  metrics: {
    pending: number;
    jobsPublished: number;
    jobsCompleted: number;
    jobsFailed: number;
    averageProcessingTimeMs: number;
    lastJobPublishedAt: string | null;
    lastJobCompletedAt: string | null;
  };
}

export function QueueMetricsCard({ queueName, metrics }: QueueMetricsCardProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return "Never";
    return new Date(isoString).toLocaleTimeString();
  };

  const getStatusBadge = () => {
    if (metrics.pending === 0) return <AdminBadge tone="success">Healthy</AdminBadge>;
    if (metrics.pending < 50) return <AdminBadge tone="info">Normal</AdminBadge>;
    if (metrics.pending < 200) return <AdminBadge tone="warning">Warning</AdminBadge>;
    return <AdminBadge tone="danger">Critical</AdminBadge>;
  };

  return (
    <AdminPanel>
      <div className="flex items-center justify-between">
        <p className="font-medium text-primary-700 text-sm uppercase tracking-[0.2em]">
          {queueName.replace(/-/g, " ")}
        </p>
        {getStatusBadge()}
      </div>

      {/* Pending jobs */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-slate-500 text-sm">Pending Jobs</span>
        <span className="font-bold text-2xl text-slate-900">{metrics.pending}</span>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-slate-500 text-xs">Published</p>
          <p className="mt-1 font-semibold text-lg text-slate-900">{metrics.jobsPublished}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-slate-500 text-xs">Completed</p>
          <p className="mt-1 font-semibold text-green-600 text-lg">{metrics.jobsCompleted}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-slate-500 text-xs">Failed</p>
          <p className="mt-1 font-semibold text-lg text-red-600">{metrics.jobsFailed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-slate-500 text-xs">Avg Time</p>
          <p className="mt-1 font-semibold text-lg text-slate-900">{formatTime(metrics.averageProcessingTimeMs)}</p>
        </div>
      </div>

      {/* Last activity */}
      <div className="mt-4 space-y-2 border-slate-200 border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-xs">Last Published</span>
          <span className="font-medium text-slate-700 text-sm">{formatDateTime(metrics.lastJobPublishedAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-xs">Last Completed</span>
          <span className="font-medium text-slate-700 text-sm">{formatDateTime(metrics.lastJobCompletedAt)}</span>
        </div>
      </div>
    </AdminPanel>
  );
}
