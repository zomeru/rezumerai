"use client";

import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";

/**
 * Props for the {@link EditResumeModal} component.
 *
 * @property title - Current resume title (pre‑filled in the input)
 * @property onSubmit - Called with the updated title on form submission
 * @property onClose - Callback to close the modal
 */
export interface EditResumeModalProps {
  title: string;
  onSubmit: (newTitle: string) => void;
  onClose: () => void;
}

/**
 * Modal form for editing an existing resume title.
 *
 * @param props - {@link EditResumeModalProps}
 * @returns The edit‑resume modal dialog
 *
 * @example
 * ```tsx
 * <EditResumeModal title="My Resume" onSubmit={update} onClose={close} />
 * ```
 */
export default function EditResumeModal({ title: initialTitle, onSubmit, onClose }: EditResumeModalProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(title);
  }

  return (
    <BaseModal isOpen={true} title="Edit Resume Title" onClose={onClose} onSubmit={handleSubmit} submitLabel="Update">
      <input
        value={title}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        type="text"
        placeholder="Enter resume title"
        className="w-full rounded border border-slate-300 px-4 py-2 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />
    </BaseModal>
  );
}
