"use client";

import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";

interface EditResumeModalProps {
  title: string;
  onSubmit: (newTitle: string) => void;
  onClose: () => void;
}

export default function EditResumeModal({
  title: initialTitle,
  onSubmit,
  onClose,
}: EditResumeModalProps): React.JSX.Element {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    onSubmit(title);
  }

  return (
    <BaseModal isOpen={true} title="Edit Resume Title" onClose={onClose} onSubmit={handleSubmit} submitLabel="Update">
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
