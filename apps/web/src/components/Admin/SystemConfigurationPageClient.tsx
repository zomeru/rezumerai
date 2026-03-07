"use client";

import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routing";
import { useSystemConfigurations, useUpdateSystemConfiguration } from "@/hooks/useAdmin";
import { AdminBadge, AdminEmptyState, AdminPageShell, AdminPanel, AdminTableWrapper, AdminTextarea } from "./AdminUI";
import { formatDateTime, formatJson } from "./format";

export default function SystemConfigurationPageClient(): React.JSX.Element {
  const { data, error, isLoading, isFetching, refetch } = useSystemConfigurations();
  const updateConfiguration = useUpdateSystemConfiguration();
  const [selectedName, setSelectedName] = useState<string>("");
  const [editorValue, setEditorValue] = useState<string>("{}");
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedConfig = useMemo(
    () => data?.items.find((item) => item.name === selectedName) ?? data?.items[0] ?? null,
    [data?.items, selectedName],
  );

  useEffect(() => {
    if (!data?.items.length) {
      return;
    }

    const nextConfig = data.items.find((item) => item.name === selectedName) ?? data.items[0];

    if (nextConfig) {
      setSelectedName(nextConfig.name);
      setEditorValue(formatJson(nextConfig.value));
      setLocalError(null);
    }
  }, [data?.items, selectedName]);

  const isDirty = useMemo(() => {
    if (!selectedConfig) {
      return false;
    }

    return formatJson(selectedConfig.value) !== editorValue;
  }, [editorValue, selectedConfig]);

  async function onSave(): Promise<void> {
    if (!selectedConfig) {
      return;
    }

    try {
      const parsed = JSON.parse(editorValue) as unknown;
      setLocalError(null);
      await updateConfiguration.mutateAsync({ name: selectedConfig.name, value: parsed });
      toast.success(`${selectedConfig.name} updated.`);
    } catch (saveError: unknown) {
      const message =
        saveError instanceof SyntaxError
          ? "Configuration must be valid JSON before it can be saved."
          : saveError instanceof Error
            ? saveError.message
            : "Failed to update configuration.";
      setLocalError(message);
      toast.error(message);
    }
  }

  return (
    <AdminPageShell
      title="System Configuration"
      description="Manage database-backed application settings used by admin workflows, AI behavior, and retention jobs."
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
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load configuration</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <AdminPanel>
            <div className="h-96 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
          <AdminPanel>
            <div className="h-96 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
        </div>
      ) : !data || data.items.length === 0 ? (
        <AdminEmptyState
          title="No configuration entries found"
          description="Seed or create a system configuration entry to manage it here."
        />
      ) : selectedConfig ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <AdminPanel className="p-0">
            <div className="border-slate-200 border-b px-6 py-5">
              <h2 className="font-semibold text-slate-900 text-xl">Configuration Entries</h2>
              <p className="mt-1 text-slate-500 text-sm">
                Stored in the `SystemConfiguration` table and validated on save.
              </p>
            </div>

            <AdminTableWrapper>
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Last Updated</th>
                    <th className="px-4 py-3 text-left">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item) => {
                    const isSelected = item.name === selectedConfig.name;
                    return (
                      <tr
                        key={item.id}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-primary-50" : "hover:bg-slate-50"}`}
                        onClick={() => {
                          setSelectedName(item.name);
                          setEditorValue(formatJson(item.value));
                          setLocalError(null);
                        }}
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-4 py-4 text-slate-600">{item.description ?? "No description yet."}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDateTime(item.updatedAt)}</td>
                        <td className="px-4 py-4">
                          <AdminBadge tone={item.validationMode === "KNOWN_SCHEMA" ? "info" : "neutral"}>
                            {item.validationMode === "KNOWN_SCHEMA" ? "Schema validated" : "Raw JSON"}
                          </AdminBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </AdminTableWrapper>
          </AdminPanel>

          <div className="space-y-6">
            <AdminPanel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Selected Entry</p>
                  <h2 className="mt-2 font-bold text-2xl text-slate-900">{selectedConfig.name}</h2>
                  <p className="mt-2 text-slate-600">
                    {selectedConfig.description ?? "No description available for this configuration entry yet."}
                  </p>
                </div>

                <AdminBadge tone={selectedConfig.validationMode === "KNOWN_SCHEMA" ? "info" : "neutral"}>
                  {selectedConfig.validationMode === "KNOWN_SCHEMA" ? "Known schema" : "Generic JSON"}
                </AdminBadge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Updated</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedConfig.updatedAt)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Created</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedConfig.createdAt)}</p>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-xl">JSON Editor</h3>
                  <p className="mt-1 text-slate-500 text-sm">
                    Edit the persisted value directly. Validation runs before the update is committed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={!isDirty || updateConfiguration.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateConfiguration.isPending ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save changes
                </button>
              </div>

              <div className="mt-4">
                <AdminTextarea value={editorValue} onChange={setEditorValue} rows={18} />
              </div>

              {localError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {localError}
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm">
                  <CheckCircle2 className="size-4" />
                  JSON is ready to validate on save.
                </div>
              )}
            </AdminPanel>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
