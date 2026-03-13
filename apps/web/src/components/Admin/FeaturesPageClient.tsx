"use client";

import { AlertCircle, FlaskConical, RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routing";
import { useFeatureFlags, useSaveFeatureFlag } from "@/hooks/useAdmin";
import {
  AdminBadge,
  AdminEmptyState,
  AdminFieldLabel,
  AdminInput,
  AdminPageShell,
  AdminPanel,
  AdminSelect,
  AdminTableWrapper,
} from "./AdminUI";
import { formatDateTime } from "./format";

const STATUS_OPTIONS = [
  { value: "false", label: "Disabled" },
  { value: "true", label: "Enabled" },
] as const;

function getStatusTone(enabled: boolean, rolloutPercentage: number): "neutral" | "success" | "warning" {
  if (!enabled) {
    return "neutral";
  }

  if (rolloutPercentage < 100) {
    return "warning";
  }

  return "success";
}

function normalizeRolloutPercentageInput(nextValue: string, currentValue: string): string {
  if (nextValue === "") {
    return "";
  }

  if (!/^\d+$/.test(nextValue)) {
    return currentValue;
  }

  return String(Math.min(100, Number(nextValue)));
}

export default function FeaturesPageClient(): React.JSX.Element {
  const { data, error, isLoading, isFetching, refetch } = useFeatureFlags();
  const saveFeatureFlag = useSaveFeatureFlag();
  const [selectedName, setSelectedName] = useState<string>("");
  const [draftEnabled, setDraftEnabled] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("false");
  const [draftDescription, setDraftDescription] = useState<string>("");
  const [draftRolloutPercentage, setDraftRolloutPercentage] = useState<string>("100");
  const [createName, setCreateName] = useState<string>("");
  const [createEnabled, setCreateEnabled] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("false");
  const [createDescription, setCreateDescription] = useState<string>("");
  const [createRolloutPercentage, setCreateRolloutPercentage] = useState<string>("100");

  const items = data?.items ?? [];
  const selectedFlag = useMemo(
    () => items.find((item) => item.name === selectedName) ?? items[0] ?? null,
    [items, selectedName],
  );

  useEffect(() => {
    if (!selectedFlag) {
      return;
    }

    setSelectedName(selectedFlag.name);
    setDraftEnabled(selectedFlag.enabled ? "true" : "false");
    setDraftDescription(selectedFlag.description ?? "");
    setDraftRolloutPercentage(String(selectedFlag.rolloutPercentage));
  }, [selectedFlag]);

  const isDirty = useMemo(() => {
    if (!selectedFlag) {
      return false;
    }

    return (
      selectedFlag.enabled !== (draftEnabled === "true") ||
      (selectedFlag.description ?? "") !== draftDescription.trim() ||
      selectedFlag.rolloutPercentage !== Number(draftRolloutPercentage)
    );
  }, [draftDescription, draftEnabled, draftRolloutPercentage, selectedFlag]);

  function parseRolloutPercentage(value: string): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      throw new Error("Rollout percentage must be an integer between 0 and 100.");
    }

    return parsed;
  }

  function normalizeDescription(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  async function onSaveSelectedFlag(): Promise<void> {
    if (!selectedFlag) {
      return;
    }

    try {
      const saved = await saveFeatureFlag.mutateAsync({
        name: selectedFlag.name,
        input: {
          enabled: draftEnabled === "true",
          description: normalizeDescription(draftDescription),
          rolloutPercentage: parseRolloutPercentage(draftRolloutPercentage),
        },
      });
      toast.success(`${saved.name} updated.`);
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save feature flag.";
      toast.error(message);
    }
  }

  async function onCreateFeatureFlag(): Promise<void> {
    const name = createName.trim();

    if (!name) {
      toast.error("Feature name is required.");
      return;
    }

    try {
      const saved = await saveFeatureFlag.mutateAsync({
        name,
        input: {
          enabled: createEnabled === "true",
          description: normalizeDescription(createDescription),
          rolloutPercentage: parseRolloutPercentage(createRolloutPercentage),
        },
      });
      setSelectedName(saved.name);
      setCreateName("");
      setCreateEnabled("false");
      setCreateDescription("");
      setCreateRolloutPercentage("100");
      toast.success(`${saved.name} saved.`);
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : "Failed to create feature flag.";
      toast.error(message);
    }
  }

  return (
    <AdminPageShell
      title="Features"
      description="Control runtime feature flags and rollout percentages without redeploying the application."
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Failed to load feature flags</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid gap-6">
          <AdminPanel>
            <div className="h-56 animate-pulse rounded bg-slate-200" />
          </AdminPanel>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <AdminPanel>
              <div className="h-96 animate-pulse rounded bg-slate-200" />
            </AdminPanel>
            <AdminPanel>
              <div className="h-96 animate-pulse rounded bg-slate-200" />
            </AdminPanel>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <AdminPanel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Create Feature Flag</p>
                <h2 className="mt-2 font-bold text-2xl text-slate-900">New runtime toggle</h2>
                <p className="mt-2 max-w-3xl text-slate-600">
                  Add a flag once, then manage rollout from this page. Disabled flags stay fully off even if a rollout
                  percentage is configured.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void onCreateFeatureFlag()}
                disabled={saveFeatureFlag.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveFeatureFlag.isPending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <FlaskConical className="size-4" />
                )}
                Create flag
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminFieldLabel label="Feature name">
                <AdminInput
                  value={createName}
                  onChange={setCreateName}
                  placeholder="new_admin_analytics_ui"
                  className="w-full"
                />
              </AdminFieldLabel>

              <AdminSelect
                label="Default status"
                value={createEnabled}
                onChange={(value) => setCreateEnabled(value as (typeof STATUS_OPTIONS)[number]["value"])}
                options={STATUS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                className="w-full"
              />

              <AdminFieldLabel label="Rollout percentage">
                <AdminInput
                  value={createRolloutPercentage}
                  onChange={(value) =>
                    setCreateRolloutPercentage((currentValue) => normalizeRolloutPercentageInput(value, currentValue))
                  }
                  placeholder="100"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </AdminFieldLabel>

              <AdminFieldLabel label="Description">
                <AdminInput
                  value={createDescription}
                  onChange={setCreateDescription}
                  placeholder="Explain what this flag controls"
                  className="w-full"
                />
              </AdminFieldLabel>
            </div>
          </AdminPanel>

          {items.length === 0 ? (
            <AdminEmptyState
              title="No feature flags found"
              description="Create a feature flag above to start rolling out new functionality safely."
            />
          ) : selectedFlag ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div>
                <AdminTableWrapper>
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Rollout</th>
                        <th className="px-4 py-3 text-left">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const isSelected = item.name === selectedFlag.name;

                        return (
                          <tr
                            key={item.id}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-primary-50" : "hover:bg-slate-50"}`}
                            onClick={() => setSelectedName(item.name)}
                          >
                            <td className="px-4 py-4">
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-slate-500 text-xs">
                                {item.description ?? "No description available."}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <AdminBadge tone={getStatusTone(item.enabled, item.rolloutPercentage)}>
                                {item.enabled ? "Enabled" : "Disabled"}
                              </AdminBadge>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{item.rolloutPercentage}%</td>
                            <td className="px-4 py-4 text-slate-600">{formatDateTime(item.updatedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </AdminTableWrapper>
              </div>

              <div className="space-y-6">
                <AdminPanel>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">Selected Flag</p>
                      <h2 className="mt-2 font-bold text-2xl text-slate-900">{selectedFlag.name}</h2>
                      <p className="mt-2 text-slate-600">
                        {selectedFlag.description ?? "No description available for this feature flag yet."}
                      </p>
                    </div>

                    <AdminBadge tone={getStatusTone(selectedFlag.enabled, selectedFlag.rolloutPercentage)}>
                      {selectedFlag.enabled ? "Enabled" : "Disabled"}
                    </AdminBadge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Updated</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedFlag.updatedAt)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-slate-500 text-xs uppercase tracking-wide">Created</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedFlag.createdAt)}</p>
                    </div>
                  </div>
                </AdminPanel>

                <AdminPanel>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-xl">Flag Settings</h3>
                      <p className="mt-1 text-slate-500 text-sm">
                        Save changes to enable or disable the flag and to adjust its rollout percentage.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void onSaveSelectedFlag()}
                      disabled={!isDirty || saveFeatureFlag.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saveFeatureFlag.isPending ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      Save changes
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <AdminSelect
                      label="Status"
                      value={draftEnabled}
                      onChange={(value) => setDraftEnabled(value as (typeof STATUS_OPTIONS)[number]["value"])}
                      options={STATUS_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      className="w-full"
                    />

                    <AdminFieldLabel label="Rollout percentage">
                      <AdminInput
                        value={draftRolloutPercentage}
                        onChange={(value) =>
                          setDraftRolloutPercentage((currentValue) =>
                            normalizeRolloutPercentageInput(value, currentValue),
                          )
                        }
                        placeholder="100"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </AdminFieldLabel>

                    <div className="md:col-span-2">
                      <AdminFieldLabel label="Description">
                        <AdminInput
                          value={draftDescription}
                          onChange={setDraftDescription}
                          placeholder="Explain what this flag controls"
                          className="w-full"
                        />
                      </AdminFieldLabel>
                    </div>
                  </div>
                </AdminPanel>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AdminPageShell>
  );
}
