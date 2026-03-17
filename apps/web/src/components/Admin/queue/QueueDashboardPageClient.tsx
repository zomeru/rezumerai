"use client";

/**
 * Queue Dashboard Page Client
 * Main dashboard for monitoring and managing job queues
 * Refactored to use shared admin UI components
 */

import { AlertTriangle, Gauge, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPageShell, AdminPanel, AdminTabs } from "@/components/Admin/AdminUI";
import { ROUTES } from "@/constants/routing";
import { useAdminQueueMetrics } from "@/hooks/useAdmin";
import { ConfigurationPanel } from "./ConfigurationPanel";
import { DeadLetterQueueBrowser } from "./DeadLetterQueueBrowser";
import { QueueMetricsCard } from "./QueueMetricsCard";

const TAB_OPTIONS = [
  { value: "overview", label: "Overview" },
  { value: "alerts", label: "Alerts" },
  { value: "timeouts", label: "Timeouts" },
  { value: "rate-limits", label: "Rate Limits" },
  { value: "batches", label: "Batches" },
  { value: "priorities", label: "Priorities" },
  { value: "dead-letter", label: "Dead Letter" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

export function QueueDashboardPageClient() {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [refetchInterval, setRefetchInterval] = useState(5000); // Start with 5s
  const [hasClientChecked, setHasClientChecked] = useState(false);

  const { data, isFetching, refetch } = useAdminQueueMetrics({
    refetchInterval,
  });

  // Initial refetch on mount to start the polling cycle
  useEffect(() => {
    void refetch().then(() => {
      setHasClientChecked(true);
    });
  }, [refetch]);

  // Adjust refetch interval based on initialization state
  useEffect(() => {
    if (data?.initialized) {
      setRefetchInterval(30000); // Slow down to 30s once initialized
    }
  }, [data?.initialized]);

  // Data is pre-populated from server, so we don't expect null
  if (!data) {
    return (
      <AdminPageShell
        title="Job Queue Dashboard"
        description="Monitor and manage background job processing"
        backHref={ROUTES.ADMIN}
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load queue dashboard data</p>
            </div>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  const isInitialized = data.initialized;
  // Only show warning after client has verified the uninitialized state
  const showWarning = !isInitialized && hasClientChecked;

  const queueNames = Object.keys(data.queues);
  const totalPending = queueNames.reduce((sum, name) => sum + (data.queues[name]?.pending ?? 0), 0);
  const totalPublished = queueNames.reduce((sum, name) => sum + (data.queues[name]?.jobsPublished ?? 0), 0);
  const totalFailed = queueNames.reduce((sum, name) => sum + (data.queues[name]?.jobsFailed ?? 0), 0);

  const tabsWithCounts = TAB_OPTIONS.map((tab) => {
    if (tab.value === "alerts") {
      return { ...tab, count: data.alerts.totalAlerts };
    }
    return tab;
  });

  return (
    <AdminPageShell
      title="Job Queue Dashboard"
      description="Monitor and manage background job processing"
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      <div className="space-y-6">
        {showWarning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Job queue not initialized</p>
                <p className="mt-1 text-amber-700 text-sm">
                  Background jobs will not be processed. This is normal during development if the worker process is not
                  running.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-700 text-sm transition-colors hover:bg-amber-100"
                  >
                    <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                    Check Status
                  </button>
                  <span className="text-amber-600 text-sm">
                    {isFetching ? "Checking..." : "Auto-refreshing every 5 seconds"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Total Pending</p>
                <p className="mt-2 font-semibold text-3xl text-slate-900">{totalPending}</p>
                <p className="mt-2 text-slate-500 text-sm">Jobs waiting to be processed</p>
              </div>
              <span className="inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
                <RefreshCw className="size-5" />
              </span>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Total Published</p>
                <p className="mt-2 font-semibold text-3xl text-slate-900">{totalPublished}</p>
                <p className="mt-2 text-slate-500 text-sm">Jobs published this session</p>
              </div>
              <span className="inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
                <TrendingUp className="size-5" />
              </span>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Total Failed</p>
                <p className="mt-2 font-semibold text-3xl text-red-600">{totalFailed}</p>
                <p className="mt-2 text-slate-500 text-sm">Jobs that failed processing</p>
              </div>
              <span className="inline-flex rounded-xl border border-red-200 bg-red-50 p-2 text-red-700">
                <AlertTriangle className="size-5" />
              </span>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide">Cache Hit Rate</p>
                <p className="mt-2 font-semibold text-3xl text-slate-900">{(data.cache.hitRate * 100).toFixed(1)}%</p>
                <p className="mt-2 text-slate-500 text-sm">
                  {data.cache.size} / {data.cache.maxEntries} entries
                </p>
              </div>
              <span className="inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
                <Gauge className="size-5" />
              </span>
            </div>
          </AdminPanel>
        </div>

        {/* Main Tabs */}
        <AdminTabs value={activeTab} onChange={setActiveTab} options={tabsWithCounts} />

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {queueNames.map((queueName) => {
                const metrics = data.queues[queueName];
                if (!metrics) return null;
                return <QueueMetricsCard key={queueName} queueName={queueName} metrics={metrics} />;
              })}
            </div>

            {/* Cache Stats */}
            <AdminPanel>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-xl">RAG Query Embedding Cache</h3>
                  <p className="mt-1 text-slate-500 text-sm">Cache statistics for AI query embeddings</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Size</p>
                  <p className="mt-1 font-semibold text-2xl text-slate-900">{data.cache.size}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Hit Rate</p>
                  <p className="mt-1 font-semibold text-2xl text-slate-900">{(data.cache.hitRate * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Hits</p>
                  <p className="mt-1 font-semibold text-2xl text-green-600">{data.cache.hitCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Misses</p>
                  <p className="mt-1 font-semibold text-2xl text-red-600">{data.cache.missCount}</p>
                </div>
              </div>
            </AdminPanel>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && <AlertsConfigurationPanel />}

        {/* Timeouts Tab */}
        {activeTab === "timeouts" && <TimeoutsConfigurationPanel />}

        {/* Rate Limits Tab */}
        {activeTab === "rate-limits" && <RateLimitsConfigurationPanel />}

        {/* Batches Tab */}
        {activeTab === "batches" && <BatchesConfigurationPanel />}

        {/* Priorities Tab */}
        {activeTab === "priorities" && <PrioritiesConfigurationPanel />}

        {/* Dead Letter Tab */}
        {activeTab === "dead-letter" && <DeadLetterQueueBrowser />}
      </div>
    </AdminPageShell>
  );
}

// Configuration Panel Components

function AlertsConfigurationPanel() {
  return (
    <ConfigurationPanel
      title="Queue Alerts"
      description="Configure alert thresholds for queue depth monitoring"
      endpoint="/api/admin/queue/alerts/config"
      fields={[
        {
          key: "warningThreshold",
          label: "Warning Threshold",
          description: "Alert when queue depth exceeds this value",
          type: "number",
          min: 1,
        },
        {
          key: "criticalThreshold",
          label: "Critical Threshold",
          description: "Critical alert when queue depth exceeds this value",
          type: "number",
          min: 1,
        },
        {
          key: "cooldownSeconds",
          label: "Alert Cooldown",
          description: "Seconds between alerts for the same queue",
          type: "number",
          min: 0,
        },
        {
          key: "enabled",
          label: "Enable Alerts",
          description: "Turn alerting on or off",
          type: "boolean",
        },
      ]}
      initialValues={{
        warningThreshold: 100,
        criticalThreshold: 500,
        cooldownSeconds: 300,
        enabled: true,
      }}
    />
  );
}

function TimeoutsConfigurationPanel() {
  return (
    <ConfigurationPanel
      title="Job Timeouts"
      description="Configure timeout settings for job processing"
      endpoint="/api/admin/queue/timeouts/config"
      fields={[
        {
          key: "defaultTimeoutSeconds",
          label: "Default Timeout",
          description: "Default timeout in seconds for jobs",
          type: "number",
          min: 1,
        },
        {
          key: "longTimeoutSeconds",
          label: "Long Timeout",
          description: "Timeout for long-running jobs",
          type: "number",
          min: 1,
        },
        {
          key: "veryLongTimeoutSeconds",
          label: "Very Long Timeout",
          description: "Timeout for very long-running jobs",
          type: "number",
          min: 1,
        },
      ]}
      initialValues={{
        defaultTimeoutSeconds: 60,
        longTimeoutSeconds: 300,
        veryLongTimeoutSeconds: 600,
      }}
    />
  );
}

function RateLimitsConfigurationPanel() {
  return (
    <div className="space-y-4">
      <AdminPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-xl">Rate Limits</h3>
            <p className="mt-1 text-slate-500 text-sm">Configure rate limiting for job publishing</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-muted-foreground text-sm">Rate limit configuration is available per job type via API.</p>
        </div>
      </AdminPanel>
    </div>
  );
}

function BatchesConfigurationPanel() {
  return (
    <div className="space-y-4">
      <AdminPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-xl">Batch Processing</h3>
            <p className="mt-1 text-slate-500 text-sm">Configure batch processing for jobs</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-muted-foreground text-sm">Batch configuration is available per job type via API.</p>
        </div>
      </AdminPanel>
    </div>
  );
}

function PrioritiesConfigurationPanel() {
  return (
    <div className="space-y-4">
      <AdminPanel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-xl">Job Priorities</h3>
            <p className="mt-1 text-slate-500 text-sm">Configure dynamic priority settings</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-muted-foreground text-sm">Priority configuration is available per job type via API.</p>
        </div>
      </AdminPanel>
    </div>
  );
}
