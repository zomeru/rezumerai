"use client";

import type React from "react";
import BaseModal from "./BaseModal";

/**
 * Props for the {@link CreateResumeModal} component.
 *
 * @property onSubmit - Called with the new resume title on form submission
 * @property onClose - Callback to close the modal
 */
export interface CreateResumeModalProps {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (title: string) => Promise<void>;
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
 * <CreateResumeModal title="My Resume" onChange={handleChange} onSubmit={create} onClose={close} />
 * ```
 */
export default function CreateResumeModal({ title, onChange, onSubmit, onClose }: CreateResumeModalProps) {
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(title);
  }

  return (
    <BaseModal
      isOpen={true}
      title="Create a resume"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Create resume"
    >
      <input
        value={title}
        onChange={onChange}
        type="text"
        placeholder="Enter resume title"
        className="w-full rounded border border-slate-300 px-4 py-2 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />
    </BaseModal>
  );
}
