import { cn } from "@rezumerai/utils/styles";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminPageShell({
  eyebrow = "Admin Console",
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-400 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-primary-700 text-sm uppercase tracking-[0.2em]">{eyebrow}</p>
            <h1 className="mt-2 bg-linear-to-r from-slate-900 via-slate-700 to-slate-600 bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {children}
      </div>
    </main>
  );
}

export function AdminPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      {children}
    </section>
  );
}

export function AdminFilterGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function AdminFieldLabel({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 text-slate-600 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </div>
  );
}

export function AdminSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn("rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm", className)}
    >
      {children}
    </select>
  );
}

export function AdminInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
}): React.JSX.Element {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn("rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm", className)}
    />
  );
}

export function AdminTextarea({
  value,
  onChange,
  rows = 12,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}): React.JSX.Element {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className={cn(
        "w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 font-mono text-slate-800 text-sm",
        className,
      )}
    />
  );
}

export function AdminStatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string;
  caption?: string;
  icon?: LucideIcon;
}): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">{title}</p>
          <p className="mt-2 font-semibold text-3xl text-slate-900">{value}</p>
          {caption ? <p className="mt-2 text-slate-500 text-sm">{caption}</p> : null}
        </div>

        {Icon ? (
          <span className="inline-flex rounded-xl border border-primary-200 bg-primary-50 p-2 text-primary-700">
            <Icon className="size-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}): React.JSX.Element {
  const toneClassName = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-primary-100 text-primary-700",
  } satisfies Record<typeof tone, string>;

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 font-semibold text-xs", toneClassName[tone])}>
      {children}
    </span>
  );
}

export function AdminTableWrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description: string }): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}): React.JSX.Element {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
      <p className="text-slate-600 text-sm">
        Page {page}
        {totalPages > 0 ? ` of ${totalPages}` : ""}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
}): React.JSX.Element {
  return (
    <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-sm transition-colors",
              isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-white/15 text-white" : "bg-slate-200 text-slate-700",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function JsonCodeBlock({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      <h3 className="mb-3 font-semibold text-slate-900">{title}</h3>
      <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-slate-800 text-xs leading-relaxed">
        {value}
      </pre>
    </div>
  );
}

function createPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
}

export function AdminTrendChart({
  title,
  description,
  data,
  series,
}: {
  title: string;
  description: string;
  data: Array<{ label: string } & Record<string, string | number>>;
  series: Array<{ key: string; label: string; color: string }>;
}): React.JSX.Element {
  const width = 760;
  const height = 220;
  const paddingX = 18;
  const paddingY = 24;
  const maxValue = Math.max(1, ...data.flatMap((row) => series.map((item) => Number(row[item.key] ?? 0))));

  return (
    <AdminPanel>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 text-xl">{title}</h2>
          <p className="mt-1 text-slate-500 text-sm">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {series.map((item) => (
            <div key={item.key} className="inline-flex items-center gap-2 text-slate-600 text-xs">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label={title}>
        <title>{title}</title>
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - paddingY - (height - paddingY * 2) * ratio;

          return <line key={ratio} x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="stroke-slate-200" />;
        })}

        {series.map((item) => {
          const points = data.map((row, index) => {
            const x = paddingX + ((width - paddingX * 2) * index) / Math.max(1, data.length - 1);
            const y = height - paddingY - (Number(row[item.key] ?? 0) / maxValue) * (height - paddingY * 2);
            return { x, y };
          });

          return (
            <path
              key={item.key}
              d={createPath(points)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {data.map((row, index) => {
          const x = paddingX + ((width - paddingX * 2) * index) / Math.max(1, data.length - 1);
          return (
            <text key={row.label} x={x} y={height - 4} textAnchor="middle" className="fill-slate-400 text-[10px]">
              {row.label}
            </text>
          );
        })}
      </svg>
    </AdminPanel>
  );
}

export function AdminBarChart({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number; secondary?: string }>;
}): React.JSX.Element {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <AdminPanel>
      <h2 className="font-semibold text-slate-900 text-xl">{title}</h2>
      <p className="mt-1 text-slate-500 text-sm">{description}</p>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <p className="truncate font-medium text-slate-800">{item.label}</p>
              <p className="shrink-0 text-slate-500">{item.secondary ?? item.value.toLocaleString()}</p>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary-500 to-primary-300"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}
