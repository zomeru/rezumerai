"use client";

import { FilePenLineIcon, PencilIcon, TrashIcon } from "lucide-react";
import type { ResumeData } from "@/constants/dummy";
import { onKeyDown } from "@/lib/utils";

interface ResumeCardProps {
  resume: ResumeData;
  color: string;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ResumeCard({ resume, color, onOpen, onEdit, onDelete }: ResumeCardProps) {
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();

  return (
    <>
      {/* biome-ignore lint/a11y/useSemanticElements: This div is intentionally used as a button container */}
      <div
        role="button"
        onClick={onOpen}
        className="group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border transition-all duration-300 hover:shadow-lg sm:max-w-36"
        style={{
          background: `linear-gradient(135deg, ${color}10, ${color}40)`,
          borderColor: `${color}40`,
        }}
        aria-label={`Open ${resume.title} resume`}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <FilePenLineIcon className="size-7 transition-all group-hover:scale-105" style={{ color }} />

        <p className="px-2 text-center text-sm transition-all group-hover:scale-105" style={{ color }}>
          {resume.title}
        </p>

        <p className="absolute bottom-1 px-2 text-center text-[11px]" style={{ color: `${color}90` }}>
          Updated on {formatDate(resume.updatedAt)}
        </p>

        {/* Action buttons */}
        <div className="absolute top-1 right-1 hidden items-center gap-1 group-hover:flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1.5 text-slate-700 transition-colors hover:bg-white/50"
            aria-label={`Delete ${resume.title}`}
          >
            <TrashIcon className="size-5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded p-1.5 text-slate-700 transition-colors hover:bg-white/50"
            aria-label={`Edit ${resume.title}`}
          >
            <PencilIcon className="size-5" />
          </button>
        </div>
      </div>
    </>
  );
}
