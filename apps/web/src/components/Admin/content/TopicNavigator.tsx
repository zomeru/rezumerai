import { AdminBadge, AdminPanel } from "../AdminUI";
import type { AdminContentEntry } from "./utils";

export default function TopicNavigator({
  entries,
  isDirtyByTopic,
  selectedTopic,
  onSelect,
}: {
  entries: AdminContentEntry[];
  isDirtyByTopic: Partial<Record<AdminContentEntry["metadata"]["topic"], boolean>>;
  selectedTopic: AdminContentEntry["metadata"]["topic"];
  onSelect: (topic: AdminContentEntry["metadata"]["topic"]) => void;
}): React.JSX.Element {
  return (
    <AdminPanel className="h-full p-4">
      <div className="mb-4">
        <p className="font-semibold text-primary-700 text-xs uppercase tracking-[0.2em]">Topics</p>
        <h2 className="mt-2 font-semibold text-lg text-slate-900">Public content</h2>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          const isSelected = entry.metadata.topic === selectedTopic;
          const isDirty = Boolean(isDirtyByTopic[entry.metadata.topic]);

          return (
            <button
              key={entry.metadata.topic}
              type="button"
              onClick={() => onSelect(entry.metadata.topic)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "border-primary-300 bg-primary-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{entry.metadata.label}</p>
                  <p className="mt-1 text-slate-500 text-sm">{entry.metadata.description}</p>
                </div>

                {isDirty ? <AdminBadge tone="warning">Unsaved</AdminBadge> : null}
              </div>
            </button>
          );
        })}
      </div>
    </AdminPanel>
  );
}
