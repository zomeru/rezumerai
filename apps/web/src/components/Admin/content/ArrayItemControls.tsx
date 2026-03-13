import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

export default function ArrayItemControls({
  label,
  onMoveDown,
  onMoveUp,
  onRemove,
  disableMoveDown = false,
  disableMoveUp = false,
}: {
  label: string;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  disableMoveDown?: boolean;
  disableMoveUp?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Move ${label} up`}
        onClick={onMoveUp}
        disabled={disableMoveUp}
        className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Move ${label} down`}
        onClick={onMoveDown}
        disabled={disableMoveDown}
        className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
