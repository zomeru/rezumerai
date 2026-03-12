"use client";

import type { AiModelOption } from "@rezumerai/types";
import { AlertCircle } from "lucide-react";
import { ROUTES } from "@/constants/routing";
import { useAiSettings } from "@/hooks/useAi";
import { AdminEmptyState, AdminPageShell, AdminTableWrapper } from "./AdminUI";

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
      backHref={ROUTES.ADMIN}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
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
      ) : models.length === 0 && !isLoading ? (
        <AdminEmptyState
          title="No AI models available"
          description="No models were returned from OpenRouter. Check your API key and try refreshing."
        />
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
              {isLoading
                ? SKELETON_KEYS.map((key) => (
                    <tr key={key}>
                      <td className="px-4 py-4">
                        <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                      </td>
                    </tr>
                  ))
                : models.map((model) => (
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
    </AdminPageShell>
  );
}
