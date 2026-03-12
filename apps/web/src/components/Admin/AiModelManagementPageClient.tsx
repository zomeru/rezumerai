"use client";

import type { AiModelOption } from "@rezumerai/types";
import { AlertCircle, ArrowLeft, Bot, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routing";
import { useAiSettings } from "@/hooks/useAi";
import { AdminEmptyState, AdminPageShell, AdminPanel, AdminStatCard, AdminTableWrapper } from "./AdminUI";

const SKELETON_KEYS = [
  "ai-model-skeleton-1",
  "ai-model-skeleton-2",
  "ai-model-skeleton-3",
  "ai-model-skeleton-4",
] as const;

export default function AiModelManagementPageClient(): React.JSX.Element {
  const { data, error, isLoading, isFetching, refetch } = useAiSettings();

  const models: AiModelOption[] = data?.models ?? [];

  return (
    <AdminPageShell
      title="AI Models"
      description="Read-only view of the AI models dynamically fetched from OpenRouter."
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
              <p className="font-semibold text-red-900">Failed to load AI models</p>
              <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <AdminStatCard
              title="Total Models"
              value={String(models.length)}
              caption="Available OpenRouter models"
              icon={Bot}
            />
          </div>

          {isLoading ? (
            <AdminPanel>
              <div className="space-y-4">
                {SKELETON_KEYS.map((key) => (
                  <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            </AdminPanel>
          ) : (
            <AdminPanel className="p-0">
              <div className="border-slate-200 border-b px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900 text-xl">Model Catalog</h2>
                    <p className="mt-1 text-slate-500 text-sm">
                      Models dynamically fetched from OpenRouter. This list is read-only.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Total</p>
                    <p className="mt-1 font-semibold text-2xl text-slate-900">{models.length}</p>
                  </div>
                </div>
              </div>

              {models.length === 0 ? (
                <div className="p-6">
                  <AdminEmptyState
                    title="No AI models available"
                    description="No models were returned from OpenRouter. Check your API key and try refreshing."
                  />
                </div>
              ) : (
                <AdminTableWrapper>
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left">Model ID</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Context Length</th>
                        <th className="px-4 py-3 text-left">Input Modalities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {models.map((model) => (
                        <tr key={model.id} className="transition-colors hover:bg-slate-50">
                          <td className="px-4 py-4 font-mono text-slate-600 text-xs">{model.id}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{model.name}</td>
                          <td className="px-4 py-4 text-slate-600">{model.contextLength.toLocaleString()}</td>
                          <td className="px-4 py-4 text-slate-600">{model.inputModalities.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AdminTableWrapper>
              )}
            </AdminPanel>
          )}
        </>
      )}
    </AdminPageShell>
  );
}
