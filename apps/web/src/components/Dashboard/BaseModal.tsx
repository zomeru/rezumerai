"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface BaseModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

/**
 * Accessible modal component with focus trap and keyboard support.
 * - Traps focus within modal when open
 * - Supports Escape key to close
 * - Restores focus when closed
 * - ARIA compliant
 */
export default function BaseModal({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "Submit",
  isLoading = false,
}: BaseModalProps): React.JSX.Element | null {
  const modalRef = useFocusTrap<HTMLFormElement>(isOpen, onClose);

  function handleModalClick(e: React.MouseEvent): void {
    e.stopPropagation();
  }

  function handleBackdropClick(e: React.MouseEvent): void {
    // Only close if clicking the backdrop directly, not children
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Backdrop div needs click handler for UX (close on outside click)
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Form has focus trap that handles all keyboard navigation */}
      <form
        ref={modalRef}
        onSubmit={onSubmit}
        onClick={handleModalClick}
        className="relative w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="font-bold text-lg">
          {title}
        </h2>
        {children}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-primary-600 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-busy={isLoading}
        >
          {isLoading ? "Loading..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Close modal"
        >
          <XIcon className="size-5" />
        </button>
      </form>
    </div>
  );
}
