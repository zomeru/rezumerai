import { AdminPanel, AdminTextarea } from "../AdminUI";

export default function RawJsonEditorPanel({
  error,
  onChange,
  onFormat,
  value,
}: {
  error: string | null;
  onChange: (value: string) => void;
  onFormat: () => void;
  value: string;
}): React.JSX.Element {
  return (
    <AdminPanel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Raw JSON</p>
          <h2 className="mt-2 font-semibold text-slate-900 text-xl">Fallback editor</h2>
          <p className="mt-2 text-slate-500 text-sm">
            Edit the persisted JSON directly when the structured form is not enough. Save stays blocked until the JSON
            parses and matches the schema for the selected topic.
          </p>
        </div>

        <button
          type="button"
          onClick={onFormat}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 text-sm transition-colors hover:bg-slate-50"
        >
          Format JSON
        </button>
      </div>

      <div className="mt-5">
        <AdminTextarea ariaLabel="Raw JSON editor" value={value} onChange={onChange} rows={22} />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">
          JSON is valid for the selected content schema.
        </div>
      )}
    </AdminPanel>
  );
}
