"use client";

import { Activity, AlertCircle, BarChart3, Clock3, Database, Layers3, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/constants/routing";
import { useAdminAnalytics } from "@/hooks/useAdmin";
import {
  AdminBarChart,
  AdminEmptyState,
  AdminFilterGrid,
  AdminPageShell,
  AdminPanel,
  AdminSelect,
  AdminStatCard,
  AdminTableWrapper,
  AdminTrendChart,
} from "./AdminUI";
import { formatDateTime, formatDuration, formatNumber, formatPercentage } from "./format";

const RANGE_OPTIONS = [
  { value: 1, label: "Last 24 hours" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
] as const;
const SKELETON_KEYS = [
  "analytics-skeleton-1",
  "analytics-skeleton-2",
  "analytics-skeleton-3",
  "analytics-skeleton-4",
  "analytics-skeleton-5",
  "analytics-skeleton-6",
] as const;

export default function AnalyticsDashboardPageClient(): React.JSX.Element {
  const [timeframeDays, setTimeframeDays] = useState<number>(7);
  const { data, error, isLoading, isFetching, refetch } = useAdminAnalytics(timeframeDays);

  return (
    <AdminPageShell
      title="Analytics"
      description="Monitor request volume, reliability, database efficiency, and background job performance from a single admin dashboard."
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      <AdminFilterGrid className="w-full sm:w-fit sm:max-w-full sm:grid-cols-[minmax(0,16rem)]">
        <AdminSelect
          label="Time range"
          value={timeframeDays}
          onChange={(value) => setTimeframeDays(Number(value))}
          options={RANGE_OPTIONS.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
          className="w-full sm:w-auto"
        />
      </AdminFilterGrid>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load analytics</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : isLoading || !data ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SKELETON_KEYS.map((key) => (
              <AdminPanel key={key}>
                <div className="h-28 animate-pulse rounded bg-slate-200" />
              </AdminPanel>
            ))}
          </div>
          <AdminPanel>
            <div className="h-72 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              title="Total Requests"
              value={formatNumber(data.summary.totalRequests)}
              caption={`Across ${data.timeframeDays} day(s)`}
              icon={BarChart3}
            />
            <AdminStatCard
              title="Total Errors"
              value={formatNumber(data.summary.totalErrors)}
              caption={`Error rate ${formatPercentage(data.summary.errorRate)}`}
              icon={AlertCircle}
            />
            <AdminStatCard
              title="Active Users"
              value={formatNumber(data.summary.activeUsers)}
              caption="Distinct users with tracked activity"
              icon={Users}
            />
            <AdminStatCard
              title="Avg Response Time"
              value={formatDuration(data.summary.averageResponseTimeMs)}
              caption="Mean API request latency"
              icon={Clock3}
            />
            <AdminStatCard
              title="Most Used Endpoint"
              value={data.summary.mostUsedEndpoint ?? "N/A"}
              caption="Highest request volume endpoint"
              icon={Activity}
            />
            <AdminStatCard
              title="Avg DB Queries / Request"
              value={data.database.averageDbQueryCount.toFixed(2)}
              caption="Mean Prisma query count per API request"
              icon={Layers3}
            />
            <AdminStatCard
              title="Avg DB Time / Request"
              value={formatDuration(data.database.averageDbQueryDurationMs)}
              caption="Mean cumulative Prisma time per API request"
              icon={Database}
            />
            <AdminStatCard
              title="Slow Query Requests"
              value={formatNumber(data.database.slowQueryRequestCount)}
              caption={`Slow-query rate ${formatPercentage(data.database.slowQueryRequestRate)}`}
              icon={Clock3}
            />
            <AdminStatCard
              title="Background Jobs"
              value={formatNumber(data.backgroundJobs.length)}
              caption="Tracked scheduled jobs in range"
              icon={ShieldCheck}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <AdminTrendChart
              title="Request Volume Over Time"
              description="Request and error counts grouped into the current reporting granularity."
              data={data.requestVolume.map((point) => ({
                label: point.label,
                requests: point.requestCount,
                errors: point.errorCount,
              }))}
              series={[
                { key: "requests", label: "Requests", color: "#0f766e" },
                { key: "errors", label: "Errors", color: "#dc2626" },
              ]}
            />

            <AdminBarChart
              title="Endpoint Usage"
              description="Most-used endpoints during the selected window."
              items={data.endpointUsage.slice(0, 6).map((item) => ({
                label: `${item.method} ${item.endpoint}`,
                value: item.requestCount,
                secondary: `${formatNumber(item.requestCount)} req · ${formatPercentage(item.errorRate)} err`,
              }))}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <AdminTrendChart
              title="Latency and Active Users"
              description="Average response time and active-user trend over the selected time range."
              data={data.requestVolume.map((point) => ({
                label: point.label,
                latency: point.averageResponseTimeMs,
                activeUsers: point.activeUsers,
              }))}
              series={[
                { key: "latency", label: "Avg response time (ms)", color: "#0369a1" },
                { key: "activeUsers", label: "Active users", color: "#7c3aed" },
              ]}
            />

            <AdminTrendChart
              title="Database Workload"
              description="Average Prisma query count and cumulative DB time per request."
              data={data.requestVolume.map((point) => ({
                label: point.label,
                dbQueries: point.averageDbQueryCount,
                dbTime: point.averageDbQueryDurationMs,
              }))}
              series={[
                { key: "dbQueries", label: "Avg DB queries", color: "#0f766e" },
                { key: "dbTime", label: "Avg DB time (ms)", color: "#b45309" },
              ]}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <AdminTrendChart
              title="Slow Query Pressure"
              description="Requests that captured at least one slow Prisma query in the selected window."
              data={data.requestVolume.map((point) => ({
                label: point.label,
                slowQueryRequests: point.slowQueryRequestCount,
                errors: point.errorCount,
              }))}
              series={[
                { key: "slowQueryRequests", label: "Slow-query requests", color: "#dc2626" },
                { key: "errors", label: "Errors", color: "#7c2d12" },
              ]}
            />

            {data.slowQueryPatterns.length === 0 ? (
              <AdminEmptyState
                title="No slow query patterns"
                description="No tracked requests crossed the slow-query threshold in the selected time range."
              />
            ) : (
              <AdminPanel>
                <h2 className="font-semibold text-slate-900 text-xl">Slow Query Patterns</h2>
                <p className="mt-1 text-slate-500 text-sm">
                  Most expensive Prisma model and operation combinations captured from request metadata.
                </p>
                <div className="mt-5 space-y-4">
                  {data.slowQueryPatterns.map((item) => (
                    <div
                      key={`${item.model}-${item.operation}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.model} {item.operation}
                          </p>
                          <p className="mt-1 text-slate-500 text-sm">
                            {formatNumber(item.occurrenceCount)} samples · avg {formatDuration(item.averageDurationMs)}
                          </p>
                        </div>
                        <div className="text-right text-slate-600 text-sm">
                          <p>Max {formatDuration(item.maxDurationMs)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            )}
          </div>

          <div className="grid gap-6">
            {data.backgroundJobs.length === 0 ? (
              <AdminEmptyState
                title="No background job data"
                description="No scheduled jobs ran during the selected time range."
              />
            ) : (
              <AdminPanel>
                <h2 className="font-semibold text-slate-900 text-xl">Background Job Performance</h2>
                <p className="mt-1 text-slate-500 text-sm">Run health and average duration for tracked cron jobs.</p>
                <div className="mt-5 space-y-4">
                  {data.backgroundJobs.map((job) => (
                    <div key={job.name} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{job.name}</p>
                          <p className="mt-1 text-slate-500 text-sm">Last run {formatDateTime(job.lastRunAt)}</p>
                        </div>
                        <div className="text-right text-slate-600 text-sm">
                          <p>{job.runCount} runs</p>
                          <p>{job.failureCount} failures</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            )}
          </div>

          <AdminPanel>
            <h2 className="font-semibold text-slate-900 text-xl">Endpoint Breakdown</h2>
            <p className="mt-1 text-slate-500 text-sm">
              High-level request, latency, and reliability metrics by endpoint.
            </p>
            <div className="mt-4">
              <AdminTableWrapper>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Endpoint</th>
                      <th className="px-4 py-3 text-left">Requests</th>
                      <th className="px-4 py-3 text-left">Errors</th>
                      <th className="px-4 py-3 text-left">Error Rate</th>
                      <th className="px-4 py-3 text-left">Avg Response Time</th>
                      <th className="px-4 py-3 text-left">Avg DB Queries</th>
                      <th className="px-4 py-3 text-left">Avg DB Time</th>
                      <th className="px-4 py-3 text-left">Slow Query Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.endpointUsage.map((item) => (
                      <tr key={`${item.method}-${item.endpoint}`}>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {item.method} {item.endpoint}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatNumber(item.requestCount)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatNumber(item.errorCount)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatPercentage(item.errorRate)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDuration(item.averageResponseTimeMs)}</td>
                        <td className="px-4 py-4 text-slate-600">{item.averageDbQueryCount.toFixed(2)}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDuration(item.averageDbQueryDurationMs)}</td>
                        <td className="px-4 py-4 text-slate-600">
                          {formatNumber(item.slowQueryRequestCount)} ({formatPercentage(item.slowQueryRequestRate)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrapper>
            </div>
          </AdminPanel>
        </div>
      )}
    </AdminPageShell>
  );
}
