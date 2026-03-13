import Link from "next/link";
import { AdminBadge, AdminPanel } from "../AdminUI";
import { formatDateTime } from "../format";
import type { ContentManagementEditorMode } from "./hooks/useContentManagementController";
import type { AdminContentEntry } from "./utils";

const EDITOR_MODE_OPTIONS = [
  { value: "STRUCTURED", label: "Structured" },
  { value: "RAW_JSON", label: "Raw JSON" },
] as const satisfies Array<{ value: ContentManagementEditorMode; label: string }>;

export default function ContentMetadataPanel({
  entry,
  isDirty,
  isSaveDisabled,
  isSaving,
  mode,
  onModeChange,
  onReset,
  onSave,
}: {
  entry: AdminContentEntry;
  isDirty: boolean;
  isSaveDisabled: boolean;
  isSaving: boolean;
  mode: ContentManagementEditorMode;
  onModeChange: (mode: ContentManagementEditorMode) => void;
  onReset: () => void;
  onSave: () => void;
}): React.JSX.Element {
  return (
    <AdminPanel className="h-full p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Selected Topic</p>
          <h2 className="mt-2 font-semibold text-slate-900 text-xl">{entry.metadata.label}</h2>
        </div>

        <AdminBadge tone={isDirty ? "warning" : "info"}>{isDirty ? "Unsaved" : "Synced"}</AdminBadge>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Configuration key</p>
          <p className="mt-1 font-medium text-slate-900">{entry.metadata.configKey}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Schema family</p>
          <p className="mt-1 font-medium text-slate-900">{entry.metadata.schemaFamily}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Updated</p>
          <p className="mt-1 font-medium text-slate-900">{formatDateTime(entry.updatedAt)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Created</p>
          <p className="mt-1 font-medium text-slate-900">{formatDateTime(entry.createdAt)}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="font-medium text-slate-700 text-sm">Editor mode</p>
        <div className="mt-2 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {EDITOR_MODE_OPTIONS.map((option) => {
            const isActive = option.value === mode;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onModeChange(option.value)}
                className={`rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
                  isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
          className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!isDirty || isSaving}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset changes
        </button>
        <Link
          href={entry.metadata.publicHref}
          className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-center font-medium text-primary-700 text-sm transition-colors hover:bg-primary-100"
        >
          Open public page
        </Link>
      </div>
    </AdminPanel>
  );
}
