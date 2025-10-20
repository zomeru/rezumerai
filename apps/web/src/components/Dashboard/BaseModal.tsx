"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { onKeyDown } from "@/lib/utils";

interface BaseModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function BaseModal({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "Submit",
  isLoading = false,
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={onKeyDown}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: This div is intentionally used as a button container */}
      <div
        role="button"
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-lg"
      >
        <h2 id="modal-title" className="font-bold text-lg">
          {title}
        </h2>

        {children}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-primary-600 py-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Close modal"
        >
          <XIcon className="size-5" />
        </button>
      </div>
    </form>
  );
}
