"use client";

import { useState } from "react";
import BaseModal from "./BaseModal";

interface CreateResumeModalProps {
  onSubmit: (title: string) => void;
  onClose: () => void;
}

export default function CreateResumeModal({
  onSubmit,
  onClose,
}: CreateResumeModalProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title);
    setTitle("");
  };

  const handleClose = () => {
    setTitle("");
    onClose();
  };

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
        onChange={(e) => setTitle(e.target.value)}
        type="text"
        placeholder="Enter resume title"
        className="w-full rounded border border-slate-300 px-4 py-2 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        required
      />
    </BaseModal>
  );
}
