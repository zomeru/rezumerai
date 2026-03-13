"use client";

import type { AnalyticsDashboard } from "@rezumerai/types";
import { Activity, AlertCircle, BarChart3, Clock3, Database, Layers3, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ROUTES } from "@/constants/routing";
import { useAdminAnalytics } from "@/hooks/useAdmin";
import {
  AdminEmptyState,
  AdminFilterGrid,
  AdminPageShell,
  AdminPanel,
  AdminSelect,
  AdminStatCard,
  AdminTableWrapper,
} from "./AdminUI";
import { formatDateTime, formatDuration, formatNumber, formatPercentage } from "./format";

const RANGE_OPTIONS = [
  { value: 1, label: "Last 24 hours" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
] as const;

const SKELETON_KEYS = [
  "interactive-analytics-skeleton-1",
  "interactive-analytics-skeleton-2",
  "interactive-analytics-skeleton-3",
  "interactive-analytics-skeleton-4",
  "interactive-analytics-skeleton-5",
  "interactive-analytics-skeleton-6",
] as const;

const CHART_SYNC_ID = "admin-analytics-interactive-timeseries";

type ChartTooltipEntry = {
  color?: string;
  dataKey?: string | number;
  name?: string;
  payload?: Record<string, unknown>;
  value?: number | string | Array<number | string>;
};

type TimeseriesSeries = {
  axisId?: "left" | "right";
  color: string;
  key: string;
  label: string;
  valueFormatter?: (value: number) => string;
};

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
    notation: "compact",
  }).format(value);
}

function truncateAxisLabel(value: string, maxLength = 26): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function getNumericValue(value: ChartTooltipEntry["value"]): number | null {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function ChartLegend({ series }: { series: TimeseriesSeries[] }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-3">
      {series.map((item) => (
        <div key={item.key} className="inline-flex items-center gap-2 text-slate-600 text-xs">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function TimeseriesTooltip({
  active,
  label,
  payload,
  series,
}: {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
  series: TimeseriesSeries[];
}): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="font-semibold text-slate-900 text-sm">{label}</p>
      <div className="mt-2 space-y-2">
        {payload.map((item) => {
          const seriesConfig = series.find((entry) => entry.key === item.dataKey || entry.label === item.name);
          const numericValue = getNumericValue(item.value);
          const renderedValue =
            numericValue !== null
              ? (seriesConfig?.valueFormatter ?? formatNumber)(numericValue)
              : String(item.value ?? "N/A");

          return (
            <div key={String(item.dataKey ?? item.name)} className="flex items-center justify-between gap-4 text-sm">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color ?? seriesConfig?.color }}
                />
                {seriesConfig?.label ?? item.name}
              </div>
              <span className="font-medium text-slate-900">{renderedValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EndpointUsageTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
}): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const details = payload[0]?.payload as
    | {
        averageDbQueryCount: number;
        averageDbQueryDurationMs: number;
        averageResponseTimeMs: number;
        errorCount: number;
        errorRate: number;
        requestCount: number;
        slowQueryRequestCount: number;
      }
    | undefined;

  if (!details) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="font-semibold text-slate-900 text-sm">{label}</p>
      <div className="mt-2 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Requests</span>
          <span className="font-medium text-slate-900">{formatNumber(details.requestCount)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Errors</span>
          <span className="font-medium text-slate-900">
            {formatNumber(details.errorCount)} ({formatPercentage(details.errorRate)})
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Avg latency</span>
          <span className="font-medium text-slate-900">{formatDuration(details.averageResponseTimeMs)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Avg DB queries</span>
          <span className="font-medium text-slate-900">{details.averageDbQueryCount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Avg DB time</span>
          <span className="font-medium text-slate-900">{formatDuration(details.averageDbQueryDurationMs)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Slow-query requests</span>
          <span className="font-medium text-slate-900">{formatNumber(details.slowQueryRequestCount)}</span>
        </div>
      </div>
    </div>
  );
}

function TimeseriesChartPanel({
  ariaLabel,
  data,
  description,
  leftAxisFormatter = formatCompactNumber,
  rightAxisFormatter,
  series,
  title,
}: {
  ariaLabel: string;
  data: Array<{ label: string } & Record<string, string | number>>;
  description: string;
  leftAxisFormatter?: (value: number) => string;
  rightAxisFormatter?: (value: number) => string;
  series: TimeseriesSeries[];
  title: string;
}): React.JSX.Element {
  const hasRightAxis = series.some((item) => item.axisId === "right");

  return (
    <AdminPanel>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 text-xl">{title}</h2>
          <p className="mt-1 text-slate-500 text-sm">{description}</p>
        </div>

        <ChartLegend series={series} />
      </div>

      <figure aria-label={ariaLabel} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={288}>
          <ComposedChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: hasRightAxis ? 18 : 8, bottom: 8, left: 4 }}
            syncId={CHART_SYNC_ID}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              minTickGap={24}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={leftAxisFormatter}
              tickLine={false}
              width={64}
              yAxisId="left"
            />
            {hasRightAxis ? (
              <YAxis
                axisLine={false}
                orientation="right"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={rightAxisFormatter}
                tickLine={false}
                width={64}
                yAxisId="right"
              />
            ) : null}
            <Tooltip
              content={<TimeseriesTooltip series={series} />}
              cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
            />
            {series.map((item) => (
              <Line
                key={item.key}
                activeDot={{ r: 4 }}
                dataKey={item.key}
                dot={false}
                isAnimationActive={false}
                name={item.label}
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                type="monotone"
                yAxisId={item.axisId ?? "left"}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </figure>
    </AdminPanel>
  );
}

function EndpointUsageChartPanel({ items }: { items: AnalyticsDashboard["endpointUsage"] }): React.JSX.Element {
  const chartData = useMemo(
    () =>
      items.slice(0, 8).map((item) => ({
        label: `${item.method} ${item.endpoint}`,
        requestCount: item.requestCount,
        errorCount: item.errorCount,
        errorRate: item.errorRate,
        averageResponseTimeMs: item.averageResponseTimeMs,
        averageDbQueryCount: item.averageDbQueryCount,
        averageDbQueryDurationMs: item.averageDbQueryDurationMs,
        slowQueryRequestCount: item.slowQueryRequestCount,
      })),
    [items],
  );

  if (chartData.length === 0) {
    return (
      <AdminEmptyState
        title="No endpoint usage data"
        description="Request-level endpoint activity will appear here once analytics events are captured."
      />
    );
  }

  return (
    <AdminPanel>
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900 text-xl">Endpoint Usage</h2>
        <p className="mt-1 text-slate-500 text-sm">
          Hover for request, reliability, and latency details on the busiest endpoints.
        </p>
      </div>

      <figure
        aria-label="Interactive endpoint usage chart"
        className="w-full"
        style={{ height: `${Math.max(320, chartData.length * 56)}px` }}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 24 }}
          >
            <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={formatCompactNumber}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={truncateAxisLabel}
              tickLine={false}
              type="category"
              width={170}
            />
            <Tooltip content={<EndpointUsageTooltip />} cursor={{ fill: "rgba(15, 23, 42, 0.04)" }} />
            <Bar
              dataKey="requestCount"
              fill="#0f766e"
              isAnimationActive={false}
              name="Requests"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </AdminPanel>
  );
}

export default function AnalyticsDashboardInteractivePageClient(): React.JSX.Element {
  const [isRangeTransitionPending, startRangeTransition] = useTransition();
  const [timeframeDays, setTimeframeDays] = useState<number>(7);
  const { data, error, isLoading, isFetching, refetch } = useAdminAnalytics(timeframeDays);

  return (
    <AdminPageShell
      title="Analytics"
      description="Monitor request volume, reliability, database efficiency, and background job performance from a single admin dashboard."
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching || isRangeTransitionPending}
    >
      <AdminFilterGrid className="w-full sm:w-fit sm:max-w-full sm:grid-cols-[minmax(0,16rem)]">
        <AdminSelect
          label="Time range"
          value={timeframeDays}
          onChange={(value) =>
            startRangeTransition(() => {
              setTimeframeDays(Number(value));
            })
          }
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
            <TimeseriesChartPanel
              ariaLabel="Interactive request volume chart"
              data={data.requestVolume.map((point) => ({
                label: point.label,
                requests: point.requestCount,
                errors: point.errorCount,
              }))}
              description="Hover across the reporting window to compare request throughput and error spikes."
              series={[
                { key: "requests", label: "Requests", color: "#0f766e", valueFormatter: formatNumber },
                { key: "errors", label: "Errors", color: "#dc2626", valueFormatter: formatNumber },
              ]}
              title="Request Volume Over Time"
            />

            <EndpointUsageChartPanel items={data.endpointUsage} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <TimeseriesChartPanel
              ariaLabel="Interactive latency and active users chart"
              data={data.requestVolume.map((point) => ({
                label: point.label,
                latency: point.averageResponseTimeMs,
                activeUsers: point.activeUsers,
              }))}
              description="Dual-axis view of latency pressure alongside active-user volume."
              leftAxisFormatter={(value) => `${value.toFixed(0)} ms`}
              rightAxisFormatter={formatCompactNumber}
              series={[
                {
                  axisId: "left",
                  key: "latency",
                  label: "Avg response time",
                  color: "#0369a1",
                  valueFormatter: formatDuration,
                },
                {
                  axisId: "right",
                  key: "activeUsers",
                  label: "Active users",
                  color: "#7c3aed",
                  valueFormatter: formatNumber,
                },
              ]}
              title="Latency and Active Users"
            />

            <TimeseriesChartPanel
              ariaLabel="Interactive database workload chart"
              data={data.requestVolume.map((point) => ({
                label: point.label,
                dbQueries: point.averageDbQueryCount,
                dbTime: point.averageDbQueryDurationMs,
              }))}
              description="Compare query volume against cumulative Prisma time per request."
              leftAxisFormatter={(value) => value.toFixed(1)}
              rightAxisFormatter={(value) => `${value.toFixed(0)} ms`}
              series={[
                {
                  axisId: "left",
                  key: "dbQueries",
                  label: "Avg DB queries",
                  color: "#0f766e",
                  valueFormatter: (value) => value.toFixed(2),
                },
                {
                  axisId: "right",
                  key: "dbTime",
                  label: "Avg DB time",
                  color: "#b45309",
                  valueFormatter: formatDuration,
                },
              ]}
              title="Database Workload"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <TimeseriesChartPanel
              ariaLabel="Interactive slow query pressure chart"
              data={data.requestVolume.map((point) => ({
                label: point.label,
                slowQueryRequests: point.slowQueryRequestCount,
                errors: point.errorCount,
              }))}
              description="Correlate slow-query requests with user-facing error spikes."
              series={[
                {
                  key: "slowQueryRequests",
                  label: "Slow-query requests",
                  color: "#dc2626",
                  valueFormatter: formatNumber,
                },
                { key: "errors", label: "Errors", color: "#7c2d12", valueFormatter: formatNumber },
              ]}
              title="Slow Query Pressure"
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
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
