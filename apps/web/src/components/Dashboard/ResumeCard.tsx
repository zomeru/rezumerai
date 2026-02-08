"use client";

import { DownloadIcon, ExternalLink, FilePenLineIcon, Loader2, PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import type { Resume } from "@/constants/dummy";
import { onKeyDown } from "@/lib/utils";

interface ResumeCardProps {
  resume: Resume;
  color: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload?: () => Promise<void>;
}

export default function ResumeCard({
  resume,
  color,
  onOpen,
  onEdit,
  onDelete,
  onDownload,
}: ResumeCardProps): React.JSX.Element {
  const [isDownloading, setIsDownloading] = useState(false);
  const formatDate = (date: string | Date): string => new Date(date).toLocaleDateString();

  async function handleDownload(e: React.MouseEvent): Promise<void> {
    e.stopPropagation();
    if (!onDownload || isDownloading) return;

    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: <div> used as a card with click handler
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      className="group relative flex h-56 w-full cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-slate-200/60 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-slate-200 hover:shadow-xl"
      aria-label={`Open ${resume.title} resume`}
      onKeyDown={onKeyDown}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10"
        style={{
          background: `linear-gradient(135deg, ${color}20, ${color}60)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex size-12 items-center justify-center rounded-xl shadow-md transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <FilePenLineIcon className="size-6" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onDownload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="rounded-lg bg-white p-2 text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isDownloading ? "Downloading..." : `Download ${resume.title}`}
              >
                {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={(e: React.MouseEvent): void => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg bg-white p-2 text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:text-slate-900"
              aria-label={`Edit ${resume.title}`}
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e: React.MouseEvent): void => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-lg bg-white p-2 text-red-600 shadow-md transition-all hover:bg-red-50"
              aria-label={`Delete ${resume.title}`}
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <h3
            className="mb-2 line-clamp-2 font-semibold text-lg transition-colors group-hover:text-slate-900"
            style={{ color: `${color}` }}
          >
            {resume.title}
          </h3>
          <p className="text-slate-500 text-sm">Updated {formatDate(resume.updatedAt)}</p>
        </div>

        <div className="mt-4 flex items-center gap-2 font-medium text-slate-600 text-sm opacity-0 transition-opacity group-hover:opacity-100">
          <span>Open</span>
          <ExternalLink className="size-4" />
        </div>
      </div>
    </div>
  );
}
