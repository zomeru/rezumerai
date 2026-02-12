"use client";

import type React from "react";
import { useState } from "react";
import BaseModal from "./BaseModal";

/**
 * Props for the {@link CreateResumeModal} component.
 *
 * @property onSubmit - Called with the new resume title on form submission
 * @property onClose - Callback to close the modal
 */
export interface CreateResumeModalProps {
  onSubmit: (title: string) => void;
  onClose: () => void;
}

/**
 * Modal form for creating a new resume with a title.
 *
 * @param props - {@link CreateResumeModalProps}
 * @returns The create‑resume modal dialog
 *
 * @example
 * ```tsx
 * <CreateResumeModal onSubmit={(title) => create(title)} onClose={close} />
 * ```
 */
export default function CreateResumeModal({ onSubmit, onClose }: CreateResumeModalProps): React.JSX.Element {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    onSubmit(title);
    setTitle("");
  }

  function handleClose(): void {
    setTitle("");
    onClose();
  }

  return (
    <BaseModal
      isOpen={true}
      title="Create a resume"
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitLabel="Create resume"
    >
      <input
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTitle(e.target.value)}
        type="text"
        placeholder="Enter resume title"
        className="w-full rounded border border-slate-300 px-4 py-2 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />
    </BaseModal>
  );
}
